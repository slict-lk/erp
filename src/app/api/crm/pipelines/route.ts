import { NextRequest, NextResponse } from 'next/server';
import { createPipeline, listPipelines } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const data = await listPipelines(tenantId);
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch pipelines' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'create' });
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const data = await createPipeline(tenantId, body);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create pipeline' }, { status });
  }
}

