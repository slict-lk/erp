import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { handleApiError } from '@/lib/error-handler';
import {
  getIntelligenceRecommendations,
  updateRecommendationStatus,
} from '@/lib/intelligence/recommendations/recommendation-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { requirePermission } = await import('@/lib/auth');
    await requirePermission('ai', 'view');

    const data = await getIntelligenceRecommendations(prisma, tenant.id);

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
        },
        ...data,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error as Error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { requirePermission } = await import('@/lib/auth');
    await requirePermission('ai', 'approve');

    const body = await request.json();
    if (!body?.recommendationId || !body?.status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'recommendationId and status are required',
            statusCode: 400,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      );
    }

    await updateRecommendationStatus(prisma, tenant.id, body.recommendationId, body.status);
    const data = await getIntelligenceRecommendations(prisma, tenant.id);

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error as Error);
  }
}
