import { NextRequest, NextResponse } from 'next/server';
import { createContactLink, listContacts } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { searchParams } = new URL(request.url);
    const data = await listContacts(tenantId, {
      customerAccountId: searchParams.get('customerAccountId') || undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch contacts' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'create' });
    const body = await request.json();
    if (!body.customerAccountId || !body.contactPartyId) {
      return NextResponse.json({ error: 'customerAccountId and contactPartyId are required' }, { status: 400 });
    }
    const item = await createContactLink(tenantId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create contact link' }, { status });
  }
}

