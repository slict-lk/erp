import { NextRequest, NextResponse } from 'next/server';
import { createAccount, listAccounts } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const accountCreateSchema = z.object({
  partyId: z.string().min(1, 'partyId is required'),
  accountCode: z.string().optional(),
  status: z.string().optional(),
  customerType: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
}).passthrough();

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { searchParams } = new URL(request.url);
    const data = await listAccounts(tenantId, searchParams.get('search') || undefined);

    return NextResponse.json({
      items: data,
      metadata: { total: data.length, page: 1, limit: 100 }
    });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch accounts' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'create' });
    const body = await request.json();
    const parsedData = accountCreateSchema.parse(body);

    const item = await createAccount(tenantId, parsedData);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create account' }, { status });
  }
}
