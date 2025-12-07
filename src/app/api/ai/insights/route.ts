import { NextRequest, NextResponse } from 'next/server';
import { getInsights } from '@/apps/ai/api';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    
    const insights = await getInsights(tenantId, unreadOnly);
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
