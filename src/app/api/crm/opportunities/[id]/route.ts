import { NextRequest, NextResponse } from 'next/server';
import { deleteOpportunity, getOpportunityById, updateOpportunity } from '@/apps/crm/api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { id } = await params;
    const item = await getOpportunityById(tenantId, id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch opportunity' }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'crm', action: 'edit' });
    const { id } = await params;
    const body = await request.json();
    const item = await updateOpportunity(tenantId, id, body, {
      userId: user.id,
      actorName: user.name ?? user.email ?? null,
    });
    return NextResponse.json(item);
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
      {
        error:
          status === 403
            ? 'Forbidden'
            : status === 500
              ? 'Failed to update opportunity'
              : message || 'Invalid request',
      },
      { status }
    );
  }
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PATCH(request, ctx);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'delete' });
    const { id } = await params;
    const result = await deleteOpportunity(tenantId, id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete opportunity' }, { status });
  }
}
