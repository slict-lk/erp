import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/inventory/stock - Get all stock movements
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const warehouseId = searchParams.get('warehouseId');
    const type = searchParams.get('type') as any;

    const client = prisma as any;

    const stockMoves = await client.stockMove.findMany({
      where: {
        tenantId: tenant.id,
        ...(productId && { productId }),
        ...(warehouseId && { warehouseId }),
        ...(type && { type }),
      },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(stockMoves);
  } catch (error) {
    console.error('Error fetching stock moves:', error);
    return NextResponse.json({ error: 'Failed to fetch stock moves' }, { status: 500 });
  }
}

// POST /api/inventory/stock - Create new stock movement
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const client = prisma as any;

    const stockMove = await client.stockMove.create({
      data: {
        reference: body.reference || `STK-${Date.now()}`,
        productId: body.productId,
        warehouseId: body.warehouseId,
        quantity: body.quantity,
        type: body.type as any,
        date: body.date ? new Date(body.date) : new Date(),
        tenantId: tenant.id,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return NextResponse.json(stockMove, { status: 201 });
  } catch (error) {
    console.error('Error creating stock move:', error);
    return NextResponse.json({ error: 'Failed to create stock move' }, { status: 500 });
  }
}

