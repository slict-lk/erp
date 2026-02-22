import { NextRequest, NextResponse } from 'next/server';
import { createActivity, listActivities } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { searchParams } = new URL(request.url);
    const data = await listActivities(tenantId, {
      leadId: searchParams.get('leadId') || undefined,
      opportunityId: searchParams.get('opportunityId') || undefined,
      accountId: searchParams.get('accountId') || undefined,
      status: searchParams.get('status') || undefined,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch activities' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'crm', action: 'create' });
    const body = await request.json();
    if (!body.activityType) return NextResponse.json({ error: 'activityType is required' }, { status: 400 });
    const item = await createActivity(tenantId, user.id, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create activity' }, { status });
  }
}

