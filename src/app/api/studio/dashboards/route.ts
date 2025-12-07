import { NextRequest, NextResponse } from 'next/server';
import { getDashboards, createDashboard } from '@/apps/studio/api';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/studio/dashboards - Fetching dashboards');

    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    
    console.log('✅ Tenant found:', tenantId);

    const dashboards = await getDashboards(tenantId);

    console.log(`✅ Found ${Array.isArray(dashboards) ? dashboards.length : 0} dashboards`);

    return NextResponse.json(dashboards || []);
  } catch (error: any) {
    console.error('❌ Error fetching dashboards:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });

    // Return empty array instead of error to prevent UI crash
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    const data = await request.json();
    
    const dashboard = await createDashboard({
      ...data,
      tenantId,
    });
    
    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
}
