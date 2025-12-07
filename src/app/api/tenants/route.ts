
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { hash } from 'bcryptjs';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isSuperAdmin) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isSuperAdmin) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const body = await req.json();
        const { name, companyName, email, subdomain, plan, adminName, adminEmail, adminPassword } = body;

        // Validate required fields
        if (!name || !companyName || !subdomain || !adminEmail || !adminPassword) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Check if subdomain exists
        const existingTenant = await prisma.tenant.findUnique({
            where: { subdomain }
        });

        if (existingTenant) {
            return new NextResponse('Subdomain already taken', { status: 400 });
        }

        // Check if admin email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingUser) {
            return new NextResponse('Admin email already registered', { status: 400 });
        }

        const hashedPassword = await hash(adminPassword, 12);

        // Create tenant and admin user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name,
                    companyName,
                    subdomain,
                    plan: plan || 'STARTER',
                    status: 'ACTIVE',
                }
            });

            const user = await tx.user.create({
                data: {
                    name: adminName || 'Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'ADMIN',
                    isSuperAdmin: false,
                    tenantId: tenant.id,
                    isActive: true,
                    modulePermissions: {
                        dashboard: { enabled: true, read: true, write: true },
                        inventory: { enabled: true, read: true, write: true },
                        sales: { enabled: true, read: true, write: true },
                        accounting: { enabled: true, read: true, write: true },
                        hr: { enabled: true, read: true, write: true },
                        crm: { enabled: true, read: true, write: true },
                        manufacturing: { enabled: true, read: true, write: true },
                        projects: { enabled: true, read: true, write: true },
                        settings: { enabled: true, read: true, write: true },
                    }
                }
            });

            return { tenant, user };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error creating tenant:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
