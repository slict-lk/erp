import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/prompts
 * Get all prompt templates for a tenant
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
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenantId parameter' },
        { status: 400 }
      );
    }

    const where: any = { tenantId };
    
    if (category) {
      where.category = category;
    }
    
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const prompts = await prisma.promptTemplate.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ],
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

    return NextResponse.json(prompts);
  } catch (error: any) {
    console.error('Error fetching prompt templates:', error);
    return NextResponse.json(
      { error: `Failed to fetch prompts: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/prompts
 * Create a new prompt template
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
      description,
      category,
      template,
      variables,
      modelId,
      isSystem,
    } = body;

    if (!tenantId || !name || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, name, template' },
        { status: 400 }
      );
    }

    const prompt = await prisma.promptTemplate.create({
      data: {
        tenantId,
        name,
        description,
        category: category || 'GENERAL',
        template,
        variables: variables || [],
        modelId,
        isSystem: isSystem || false,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error: any) {
    console.error('Error creating prompt template:', error);
    return NextResponse.json(
      { error: `Failed to create prompt: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai/prompts
 * Update a prompt template
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
    const { id, tenantId, ...updateData } = body;

    if (!id || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: id, tenantId' },
        { status: 400 }
      );
    }

    const prompt = await prisma.promptTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(prompt);
  } catch (error: any) {
    console.error('Error updating prompt template:', error);
    return NextResponse.json(
      { error: `Failed to update prompt: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai/prompts
 * Delete a prompt template
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

    await prisma.promptTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting prompt template:', error);
    return NextResponse.json(
      { error: `Failed to delete prompt: ${error.message}` },
      { status: 500 }
    );
  }
}
