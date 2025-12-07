import { NextRequest, NextResponse } from 'next/server';
import { getCustomModules, createCustomModule } from '@/apps/studio/api';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/studio/modules - Fetching custom modules');

    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    
    console.log('✅ Tenant found:', tenantId);

    const modules = await getCustomModules(tenantId);

    console.log(`✅ Found ${Array.isArray(modules) ? modules.length : 0} custom modules`);

    return NextResponse.json(modules || []);
  } catch (error: any) {
    console.error('❌ Error fetching custom modules:', error);
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
    
    const module = await createCustomModule({
      ...data,
      tenantId,
    });
    
    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error('Error creating custom module:', error);
    return NextResponse.json(
      { error: 'Failed to create custom module' },
      { status: 500 }
    );
  }
}
