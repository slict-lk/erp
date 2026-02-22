import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSalesOrderV2, listSalesOrdersV2 } from '@/apps/sales/canonical-api';
import { requireTenantContext } from '@/lib/server/erp-context';

const client = prisma as any;
export const dynamic = 'force-dynamic';

function calcLine(line: any) {
  const quantity = Number(line.quantity || 0);
  const unitPrice = Number(line.unitPrice || 0);
  const discount = Number(line.discount || 0);
  const tax = Number(line.tax || 0);
  const subtotal = quantity * unitPrice;
  const afterDiscount = subtotal - (subtotal * discount) / 100;
  const lineTax = (afterDiscount * tax) / 100;
  return {
    productId: line.productId ?? null,
    description: line.description ?? line.productName ?? 'Item',
    quantity,
    unitPrice,
    discount,
    tax,
    lineTotal: afterDiscount + lineTax,
  };
}

function mapLegacyOrder(order: any) {
  return {
    ...order,
    orderNumber: order.number,
    subtotal: order.subtotal ?? order.total,
    total: order.total ?? order.grandTotal,
    lines: (order.lines || []).map((l: any) => ({
      id: l.id,
      productId: l.productId,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      tax: l.tax,
      subtotal: l.lineTotal,
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { searchParams } = new URL(request.url);
    const useV2 = ['1', 'true', 'v2'].includes((searchParams.get('v2') || '').toLowerCase());

    if (useV2) {
      const orders = await listSalesOrdersV2(tenantId, {
        status: searchParams.get('status') || undefined,
        customerAccountId: searchParams.get('customerAccountId') || undefined,
        approvalStatus: searchParams.get('approvalStatus') || undefined,
      });
      return NextResponse.json(orders);
    }

    const statusParam = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const orders = await client.salesOrder.findMany({
      where: {
        tenantId,
        ...(statusParam && { status: statusParam }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: true,
        invoices: true,
        lines: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders.map(mapLegacyOrder));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error fetching sales orders:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch sales orders' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'sales', action: 'create' });
    const body = await request.json();
    const useV2 = body?.mode === 'v2' || !!body?.customerAccountId || !!body?.sourceQuoteId;

    if (useV2) {
      const order = await createSalesOrderV2(tenantId, user.id, body);
      return NextResponse.json(order, { status: 201 });
    }

    const lines = (Array.isArray(body.lines) ? body.lines : []).map(calcLine);
    const subtotal = lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice, 0);
    const discount = lines.reduce((s: number, l: any) => s + ((l.quantity * l.unitPrice) * (l.discount || 0)) / 100, 0);
    const tax = lines.reduce((s: number, l: any) => {
      const lineSubtotal = l.quantity * l.unitPrice;
      const afterDiscount = lineSubtotal - (lineSubtotal * (l.discount || 0)) / 100;
      return s + (afterDiscount * (l.tax || 0)) / 100;
    }, 0);
    const total = subtotal - discount + tax;

    const order = await client.salesOrder.create({
      data: {
        number: body.orderNumber || `SO-${Date.now()}`,
        status: body.status || 'DRAFT',
        customerId: body.customerId,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        subtotal,
        tax,
        discount,
        total,
        grandTotal: body.grandTotal ?? total,
        notes: body.notes ?? null,
        branchId: body.branchId ?? null,
        sourceQuotationId: body.sourceQuotationId ?? null,
        tenantId,
        ...(lines.length > 0
          ? {
              lines: {
                create: lines.map((l: any) => ({
                  tenantId,
                  productId: l.productId,
                  description: l.description,
                  quantity: l.quantity,
                  unitPrice: l.unitPrice,
                  discount: l.discount,
                  tax: l.tax,
                  lineTotal: l.lineTotal,
                })),
              },
            }
          : {}),
      },
      include: {
        customer: true,
        invoices: true,
        lines: true,
      },
    });

    return NextResponse.json(mapLegacyOrder(order), { status: 201 });
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = message.includes('Forbidden')
      ? 403
      : /approval|credit|threshold|inactive|invalid|exceed/i.test(message)
        ? 400
        : 500;
    console.error('Error creating sales order:', error);
    return NextResponse.json(
      { error: status === 403 ? 'Forbidden' : status === 500 ? 'Failed to create sales order' : message || 'Invalid request' },
      { status }
    );
  }
}
