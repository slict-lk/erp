import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { formatSuccessResponse, formatPaginatedResponse } from '@/lib/error-handler';
import { tryCatch } from '@/lib/error-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return tryCatch(async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const includeChildren = searchParams.get('includeChildren') === 'true';

    const where: any = {
      tenantId: tenant.id,
    };

    if (parentId) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    const categories = await (prisma as any).productCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        ...(includeChildren && {
          children: {
            include: {
              _count: {
                select: {
                  products: true,
                },
              },
            },
          },
        }),
      },
      orderBy: [
        { parentId: 'asc' },
        { name: 'asc' },
      ],
    });

    // Build hierarchical structure if requested
    let result = categories;
    if (includeChildren) {
      const categoryMap = new Map();
      const rootCategories: any[] = [];

      // First pass: create map and identify roots
      categories.forEach((category: any) => {
        categoryMap.set(category.id, { ...category, children: [] });
        if (!category.parentId) {
          rootCategories.push(categoryMap.get(category.id));
        }
      });

      // Second pass: build hierarchy
      categories.forEach((category: any) => {
        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            parent.children.push(categoryMap.get(category.id));
          }
        }
      });

      result = rootCategories;
    }

    return NextResponse.json(formatSuccessResponse(result));
  }, 'Failed to fetch categories');
}

export async function POST(request: NextRequest) {
  return tryCatch(async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate names within the same parent
    const existingCategory = await (prisma as any).productCategory.findFirst({
      where: {
        tenantId: tenant.id,
        name: body.name,
        parentId: body.parentId || null,
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists in the selected parent category' },
        { status: 400 }
      );
    }

    // Prevent circular references
    if (body.parentId) {
      const parentCategory = await (prisma as any).productCategory.findUnique({
        where: { id: body.parentId },
      });

      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        );
      }

      // Check if this would create a circular reference
      let currentParent = parentCategory;
      while (currentParent.parentId) {
        if (currentParent.parentId === body.parentId) {
          return NextResponse.json(
            { error: 'Cannot create circular category hierarchy' },
            { status: 400 }
          );
        }
        currentParent = await (prisma as any).productCategory.findUnique({
          where: { id: currentParent.parentId },
        });
      }
    }

    const category = await (prisma as any).productCategory.create({
      data: {
        name: body.name,
        description: body.description,
        parentId: body.parentId || null,
        tenantId: tenant.id,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(
      formatSuccessResponse(category, 'Category created successfully')
    );
  }, 'Failed to create category');
}

