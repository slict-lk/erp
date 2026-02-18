import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { AVAILABLE_MODULES, type ModulePermissions } from '@/lib/modules';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

// Validation schema
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    companyName: z.string().min(2, 'Company name must be at least 2 characters').max(100),
    selectedApps: z.array(z.string()).min(1, 'Select at least one app'),
});

/**
 * Generate a URL-safe subdomain slug from company name
 */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);
}

/**
 * Build module permissions object for selected apps
 * Only selected apps get enabled; core modules (dashboard, settings) are always included
 */
function buildModulePermissions(selectedApps: string[]): ModulePermissions {
    const permissions: ModulePermissions = {};
    const coreModuleIds = ['dashboard', 'settings', 'users'];

    AVAILABLE_MODULES.forEach((module) => {
        const isSelected = selectedApps.includes(module.id);
        const isCore = coreModuleIds.includes(module.id);

        permissions[module.id] = {
            enabled: isSelected || isCore,
            view: isSelected || isCore,
            create: isSelected || (isCore && module.permissions.create),
            edit: isSelected || (isCore && module.permissions.edit),
            delete: isSelected,
            export: isSelected ? (module.permissions.export || false) : false,
            import: isSelected ? (module.permissions.import || false) : false,
            approve: isSelected ? (module.permissions.approve || false) : false,
        };
    });

    return permissions;
}

export async function POST(req: NextRequest) {
    try {
        // 1. Rate limiting
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

        const rateLimitResult = await checkRateLimit(ip);
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            );
        }

        // 2. Parse and validate input
        const body = await req.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, email, password, companyName, selectedApps } = validation.data;

        // 3. Validate selected apps exist
        const validModuleIds = AVAILABLE_MODULES.map((m) => m.id);
        const invalidApps = selectedApps.filter((id) => !validModuleIds.includes(id));
        if (invalidApps.length > 0) {
            return NextResponse.json(
                { error: `Invalid app IDs: ${invalidApps.join(', ')}` },
                { status: 400 }
            );
        }

        // 4. Check for existing email (generic message to prevent enumeration)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Registration failed. If you already have an account, please sign in.' },
                { status: 409 }
            );
        }

        // 5. Generate unique subdomain
        let subdomain = slugify(companyName);
        const existingTenant = await prisma.tenant.findFirst({ where: { subdomain } });
        if (existingTenant) {
            // Append random 4-char suffix
            const suffix = Math.random().toString(36).substring(2, 6);
            subdomain = `${subdomain}-${suffix}`;
        }

        // 6. Hash password
        const hashedPassword = await hash(password, 12);

        // 7. Calculate trial end date (14 days from now)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);

        // 8. Build module permissions and enabled modules list
        const coreModuleIds = ['dashboard', 'settings', 'users'];
        const enabledModules = [...new Set([...coreModuleIds, ...selectedApps])];
        const modulePermissions = buildModulePermissions(selectedApps);

        // 9. Create tenant and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    companyName,
                    subdomain,
                    plan: 'trial',
                    trialEnd,
                    enabledModules,
                    settings: {
                        emailsSent: {},
                        trialStartedAt: new Date().toISOString(),
                    },
                },
            });

            // Create admin user for the tenant
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'ADMIN',
                    tenantId: tenant.id,
                    isActive: true,
                    modulePermissions: modulePermissions as any,
                },
            });

            return { tenant, user };
        });

        // 10. Send welcome email (non-blocking)
        const selectedModuleNames = AVAILABLE_MODULES
            .filter((m) => selectedApps.includes(m.id))
            .map((m) => m.name);

        sendWelcomeEmail(email, {
            name,
            companyName,
            trialEnd,
            selectedApps: selectedModuleNames,
            loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
        }).catch((err) => console.error('Welcome email failed:', err));

        return NextResponse.json(
            {
                message: 'Registration successful! Please sign in.',
                tenantId: result.tenant.id,
                subdomain: result.tenant.subdomain,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
