import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { AccountType } from '@prisma/client';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const tenant = await getOrCreateDefaultTenant();
        const account = await prisma.account.findUnique({
            where: {
                id: params.id,
                tenantId: tenant.id,
            },
            include: {
                parent: true,
                children: true,
            },
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error fetching account:', error);
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const tenant = await getOrCreateDefaultTenant();
        const body = await request.json();

        const account = await prisma.account.update({
            where: {
                id: params.id,
                tenantId: tenant.id,
            },
            data: {
                code: body.code,
                name: body.name,
                type: body.type as AccountType,
                currency: body.currency,
                balance: body.balance,
                parentId: body.parentId === 'none' ? null : body.parentId,
            },
        });

        return NextResponse.json(account);
    } catch (error) {
        console.error('Error updating account:', error);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const tenant = await getOrCreateDefaultTenant();

        await prisma.account.delete({
            where: {
                id: params.id,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
