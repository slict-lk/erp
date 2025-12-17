import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/models/usage
 * Get model usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const modelId = searchParams.get('modelId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    const where: any = { tenantId };
    
    if (modelId) {
      where.modelId = modelId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const usage = await prisma.modelUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        model: {
          select: {
            name: true,
            provider: true,
            modelId: true,
          },
        },
      },
    });

    // Calculate aggregated statistics
    const stats = await prisma.modelUsage.groupBy({
      by: ['modelId'],
      where,
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _avg: {
        latencyMs: true,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      usage,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching model usage:', error);
    return NextResponse.json(
      { error: `Failed to fetch usage: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/models/usage
 * Record model usage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      tenantId,
      modelId,
      conversationId,
      userId,
      operation,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      latencyMs,
      success,
      errorMessage,
      metadata,
    } = body;

    if (!tenantId || !modelId || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, modelId, operation' },
        { status: 400 }
      );
    }

    const usage = await prisma.modelUsage.create({
      data: {
        tenantId,
        modelId,
        conversationId,
        userId: userId || session.user.id,
        operation,
        promptTokens: promptTokens || 0,
        completionTokens: completionTokens || 0,
        totalTokens: totalTokens || 0,
        cost: cost || 0,
        latencyMs,
        success: success !== false,
        errorMessage,
        metadata,
      },
    });

    // Update model statistics
    await prisma.languageModel.update({
      where: { id: modelId },
      data: {
        usageCount: { increment: 1 },
        totalTokens: { increment: BigInt(totalTokens || 0) },
        totalCost: { increment: cost || 0 },
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json(usage, { status: 201 });
  } catch (error: any) {
    console.error('Error recording model usage:', error);
    return NextResponse.json(
      { error: `Failed to record usage: ${error.message}` },
      { status: 500 }
    );
  }
}
