import { NextRequest, NextResponse } from 'next/server';
import { deleteLead, getLeadById, updateLead } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { id } = await params;
    const lead = await getLeadById(tenantId, id);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch lead' }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'crm', action: 'edit' });
    const { id } = await params;
    const body = await request.json();
    const lead = await updateLead(tenantId, id, body, {
      userId: user.id,
      actorName: user.name ?? user.email ?? null,
    });
    return NextResponse.json(lead);
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = message.includes('Forbidden')
      ? 403
      : /not found/i.test(message)
        ? 404
        : /invalid|restricted|not allowed|requires approval/i.test(message)
          ? 400
          : 500;
    return NextResponse.json(
      { error: status === 403 ? 'Forbidden' : status === 500 ? 'Failed to update lead' : message || 'Invalid request' },
      { status }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'delete' });
    const { id } = await params;
    const result = await deleteLead(tenantId, id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete lead' }, { status });
  }
}
