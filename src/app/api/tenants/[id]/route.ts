
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isSuperAdmin) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const { id } = await params;

        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        properties: true,
                    },
                },
            },
        });

        if (!tenant) {
            return new NextResponse('Tenant not found', { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Error fetching tenant:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isSuperAdmin) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, companyName, plan, status, domain } = body;

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                name,
                companyName,
                plan,
                status,
                domain: domain || null,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error('Error updating tenant:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.isSuperAdmin) {
            return new NextResponse('Unauthorized', { status: 403 });
        }

        const { id } = await params;

        await prisma.tenant.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting tenant:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
