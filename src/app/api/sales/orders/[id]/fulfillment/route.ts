import { NextRequest, NextResponse } from 'next/server';
import { createFulfillmentRequestV2 } from '@/apps/sales/canonical-api';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await createFulfillmentRequestV2(tenantId, id, user.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = message.includes('Forbidden')
      ? 403
      : /invalid|approval|blocked|not found/i.test(message)
        ? 400
        : 500;
    return NextResponse.json(
      {
        error:
          status === 403
            ? 'Forbidden'
            : status === 500
              ? 'Failed to create fulfillment request'
              : message || 'Invalid request',
      },
      { status }
    );
  }
}
