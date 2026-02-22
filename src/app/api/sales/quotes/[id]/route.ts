import { NextRequest, NextResponse } from 'next/server';
import { deleteSalesQuote, getSalesQuoteById, updateSalesQuote } from '@/apps/sales/canonical-api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { id } = await params;
    const quote = await getSalesQuoteById(tenantId, id);
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(quote);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch quote' }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    const { id } = await params;
    const body = await request.json();
    const quote = await updateSalesQuote(tenantId, id, user.id, body);
    return NextResponse.json(quote);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    const message = /not found/i.test(error?.message || '') ? 'Not found' : status === 403 ? 'Forbidden' : 'Failed to update quote';
    return NextResponse.json({ error: message }, { status: message === 'Not found' ? 404 : status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'delete' });
    const { id } = await params;
    const result = await deleteSalesQuote(tenantId, id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete quote' }, { status });
  }
}

