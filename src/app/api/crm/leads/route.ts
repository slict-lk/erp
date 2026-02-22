import { NextRequest, NextResponse } from 'next/server';
import { createLead, listLeads } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { searchParams } = new URL(request.url);
    const data = await listLeads(tenantId, {
      status: searchParams.get('status') || undefined,
      ownerUserId: searchParams.get('ownerUserId') || undefined,
      pipelineId: searchParams.get('pipelineId') || undefined,
      stageId: searchParams.get('stageId') || undefined,
      search: searchParams.get('search') || undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch leads' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'crm', action: 'create' });
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const lead = await createLead(tenantId, user.id, body);
    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = message.includes('Forbidden')
      ? 403
      : /invalid|restricted|not allowed|requires approval/i.test(message)
        ? 400
        : 500;
    return NextResponse.json(
      { error: status === 403 ? 'Forbidden' : status === 500 ? 'Failed to create lead' : message || 'Invalid request' },
      { status }
    );
  }
}
