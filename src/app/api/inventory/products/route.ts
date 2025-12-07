import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { Prisma } from '@prisma/client';


export const dynamic = 'force-dynamic';
// GET /api/inventory/products - Get all products
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const typeParam = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');

    const products = await prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(typeParam && { type: typeParam as 'STORABLE' | 'CONSUMABLE' | 'SERVICE' }),
        ...(categoryId && { category: categoryId }),
        ...(isActive && { isActive: isActive === 'true' }),
      },
      include: {
        stockMovements: true,
        invoiceLines: true,
      } as Prisma.ProductFindManyArgs['include'],
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/inventory/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        type: (body.type as 'STORABLE' | 'CONSUMABLE' | 'SERVICE') || 'STORABLE',
        salePrice: body.salePrice || body.listPrice || 0,
        costPrice: body.costPrice || 0,
        stockQty: body.stockQty || body.qtyAvailable || 0,
        minStockQty: body.minStockQty || 0,
        barcode: body.barcode,
        category: body.category,
        isActive: body.isActive !== false,
        images: body.images || [],
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

