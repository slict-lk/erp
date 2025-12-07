import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/inventory/purchase-orders - Get all purchase orders
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const supplier = searchParams.get('supplier');

    const client = prisma as any;

    const purchaseOrders = await client.purchaseOrder.findMany({
      where: {
        tenantId: tenant.id,
        ...(status && { status }),
        ...(supplier && { supplier: { contains: supplier, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST /api/inventory/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const client = prisma as any;

    const purchaseOrder = await client.purchaseOrder.create({
      data: {
        orderNumber: body.orderNumber || `PO-${Date.now()}`,
        status: (body.status as any) || 'DRAFT',
        supplier: body.supplier,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        subtotal: body.subtotal,
        tax: body.tax || 0,
        total: body.total,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}

