import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { seedModuleAccounts, seedAllModuleAccounts } from '@/lib/accounting/module-accounts-seed';

/**
 * POST /api/accounting/seed-module-accounts
 *
 * Seeds Chart of Accounts entries and default account mappings for a module.
 * Body: { moduleSlug?: string }
 *   - If moduleSlug is provided, seeds only that module
 *   - If omitted, seeds all enabled modules for the tenant
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const tenantId = session.user.tenantId;

        if (body.moduleSlug) {
            const result = await seedModuleAccounts(tenantId, body.moduleSlug);
            return NextResponse.json({
                message: `Seeded accounts for ${body.moduleSlug}`,
                ...result,
            });
        }

        const result = await seedAllModuleAccounts(tenantId);
        return NextResponse.json({
            message: `Seeded accounts for ${result.modules.length} modules`,
            ...result,
        });
    } catch (error: any) {
        console.error('[Seed Module Accounts] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to seed module accounts' },
            { status: 500 }
        );
    }
}
