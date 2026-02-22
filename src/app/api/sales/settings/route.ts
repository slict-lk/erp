import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

// Placeholder canonical endpoint for sales commercial settings (tax/discount/approval thresholds).
export async function GET() {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    return NextResponse.json({
      tenantId,
      status: 'partial',
      defaults: {
        approval: {
          discountThresholdPercent: 10,
          marginThresholdPercent: null,
          creditHoldBlocksOrder: true,
        },
        pricing: {
          defaultCurrency: 'USD',
          taxMode: 'EXCLUSIVE',
        },
      },
    });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch sales settings' }, { status });
  }
}

export async function PUT(_request: NextRequest) {
  try {
    await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    return NextResponse.json(
      { error: 'Persisted sales settings are planned for a later phase' },
      { status: 501 }
    );
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to update sales settings' }, { status });
  }
}

