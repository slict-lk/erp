import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/models
 * Get all language models for a tenant
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
    const provider = searchParams.get('provider');
    const isActive = searchParams.get('isActive');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    const where: any = { tenantId };
    
    if (provider) {
      where.provider = provider;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const models = await prisma.languageModel.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        provider: true,
        modelId: true,
        description: true,
        capabilities: true,
        contextWindow: true,
        maxTokens: true,
        temperature: true,
        isDefault: true,
        isActive: true,
        usageCount: true,
        totalTokens: true,
        totalCost: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert BigInt to string for JSON serialization
    const serializedModels = models.map(model => ({
      ...model,
      totalTokens: model.totalTokens?.toString() || '0',
    }));

    return NextResponse.json(serializedModels);
  } catch (error: any) {
    console.error('Error fetching language models:', error);
    return NextResponse.json(
      { error: `Failed to fetch models: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/models
 * Create a new language model
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
      name,
      provider,
      modelId,
      description,
      capabilities,
      contextWindow,
      maxTokens,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      apiEndpoint,
      apiKey,
      isDefault,
      config,
      metadata,
    } = body;

    if (!tenantId || !name || !provider || !modelId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name, provider, modelId' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.languageModel.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const model = await prisma.languageModel.create({
      data: {
        tenantId,
        name,
        provider,
        modelId,
        description,
        capabilities: capabilities || [],
        contextWindow: contextWindow || 4096,
        maxTokens,
        temperature: temperature ?? 0.7,
        topP: topP ?? 1.0,
        frequencyPenalty: frequencyPenalty ?? 0.0,
        presencePenalty: presencePenalty ?? 0.0,
        apiEndpoint,
        apiKey, // TODO: Encrypt this
        isDefault: isDefault || false,
        config,
        metadata,
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error: any) {
    console.error('Error creating language model:', error);
    return NextResponse.json(
      { error: `Failed to create model: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/models
 * Update a language model
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, tenantId, isDefault, ...updateData } = body;

    if (!id || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: id, tenantId' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.languageModel.updateMany({
        where: { tenantId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const model = await prisma.languageModel.update({
      where: { id },
      data: {
        ...updateData,
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json(model);
  } catch (error: any) {
    console.error('Error updating language model:', error);
    return NextResponse.json(
      { error: `Failed to update model: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/models
 * Delete a language model
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const tenantId = searchParams.get('tenantId');

    if (!id || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, tenantId' },
        { status: 400 }
      );
    }

    await prisma.languageModel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting language model:', error);
    return NextResponse.json(
      { error: `Failed to delete model: ${error.message}` },
      { status: 500 }
    );
  }
}
