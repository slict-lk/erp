import { NextRequest, NextResponse } from 'next/server';
import { generateRevenueForecast } from '@/apps/ai/api';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const tenantId = tenant.id;
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6');
    
    const forecast = await generateRevenueForecast(tenantId, months);
    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Error generating forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
