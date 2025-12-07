import { NextRequest, NextResponse } from 'next/server';
import { getWorkflows, createWorkflow } from '@/apps/ai/api';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const workflows = await getWorkflows(tenantId, activeOnly);
    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    const data = await request.json();
    
    const workflow = await createWorkflow({
      ...data,
      tenantId,
    });
    
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
