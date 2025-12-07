import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/tenant/current - Get current tenant
export async function GET(request: NextRequest) {
  try {
    // In a real app, you would get this from the session or subdomain
    // For now, we'll get or create a default tenant
    const tenant = await getOrCreateDefaultTenant();

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant', details: error.message },
      { status: 500 }
    );
  }
}

