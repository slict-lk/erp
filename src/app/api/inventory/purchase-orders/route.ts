import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/inventory/purchase-orders - Get all purchase orders
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const searchParams = new URL(request.url).searchParams;
    const status = searchParams.get('status');
    const vendorId = searchParams.get('vendorId') || searchParams.get('supplierId'); // Fallback compatibility

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        tenantId: tenant.id,
        ...(status && { status }),
        ...(vendorId && { vendorId }),
      },
      include: {
        vendor: true,
        items: true
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

    if (!body.vendorId && !body.supplierId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
    }

    const subtotal = !isNaN(Number(body.subtotal)) ? Number(body.subtotal) : 0;
    const tax = !isNaN(Number(body.tax)) ? Number(body.tax) : 0;
    const total = !isNaN(Number(body.total)) ? Number(body.total) : 0;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: body.orderNumber || `PO-${Date.now()}`,
        status: body.status || 'DRAFT',
        vendorId: body.vendorId || body.supplierId,
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        subtotal,
        tax,
        total,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}

