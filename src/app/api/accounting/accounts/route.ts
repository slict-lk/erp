import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { AccountType } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/accounting/accounts - Get all accounts
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AccountType | null;
    const parentId = searchParams.get('parentId');

    const accounts = await prisma.account.findMany({
      where: {
        tenantId: tenant.id,
        ...(type && { type }),
        ...(parentId && { parentId }),
      },
      include: {
        parent: true,
        children: true,
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST /api/accounting/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const account = await prisma.account.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type as AccountType,
        currency: body.currency || tenant.baseCurrency || 'LKR',
        normalBalance: body.normalBalance || 'DEBIT',
        description: body.description,
        isSystemAccount: body.isSystemAccount || false,
        parentId: body.parentId,
        tenantId: tenant.id,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

