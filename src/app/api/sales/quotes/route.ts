import { NextRequest, NextResponse } from 'next/server';
import { createSalesQuote, listSalesQuotes } from '@/apps/sales/canonical-api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { searchParams } = new URL(request.url);
    const data = await listSalesQuotes(tenantId, {
      status: searchParams.get('status') || undefined,
      customerAccountId: searchParams.get('customerAccountId') || undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch quotes' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'sales', action: 'create' });
    const body = await request.json();
    const data = await createSalesQuote(tenantId, user.id, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create quote' }, { status });
  }
}

