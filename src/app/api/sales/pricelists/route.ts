import { NextRequest, NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

// Placeholder canonical endpoint for Phase 4 pricing framework.
export async function GET() {
  try {
    await requireTenantContext({ moduleId: 'sales', action: 'view' });
    return NextResponse.json({ items: [], status: 'not_implemented_yet' });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch price lists' }, { status });
  }
}

export async function POST(_request: NextRequest) {
  try {
    await requireTenantContext({ moduleId: 'sales', action: 'create' });
    return NextResponse.json(
      { error: 'Price lists are planned for Phase 4 and not implemented yet' },
      { status: 501 }
    );
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create price list' }, { status });
  }
}

