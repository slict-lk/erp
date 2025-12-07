import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/sales/orders - Get all sales orders
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const orders = await prisma.salesOrder.findMany({
      where: {
        tenantId: tenant.id,
        ...(statusParam && { status: statusParam as 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED' }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: true,
        invoices: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    return NextResponse.json({ error: 'Failed to fetch sales orders' }, { status: 500 });
  }
}

// POST /api/sales/orders - Create new sales order
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const order = await prisma.salesOrder.create({
      data: {
        number: body.orderNumber || `SO-${Date.now()}`,
        status: body.status || 'DRAFT',
        customerId: body.customerId,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        tax: body.tax || 0,
        discount: body.discount || 0,
        total: body.total,
        grandTotal: body.grandTotal ?? body.total,
        notes: body.notes,
        tenantId: tenant.id,
      },
      include: {
        customer: true,
        invoices: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating sales order:', error);
    return NextResponse.json({ error: 'Failed to create sales order' }, { status: 500 });
  }
}

