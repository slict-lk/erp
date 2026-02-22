import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteSalesOrderV2, getSalesOrderV2ById, updateSalesOrderV2 } from '@/apps/sales/canonical-api';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { id } = await params;
    const useV2 = ['1', 'true', 'v2'].includes((request.nextUrl.searchParams.get('v2') || '').toLowerCase());

    if (useV2) {
      const order = await getSalesOrderV2ById(tenantId, id);
      if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(order);
    }

    const order = await client.salesOrder.findFirst({
      where: { id, tenantId },
      include: { customer: true, invoices: true, lines: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(mapLegacyOrder(order));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch order' }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    const { id } = await params;
    const body = await request.json();
    const useV2 = body?.mode === 'v2' || !!body?.customerAccountId || !!body?.sourceQuoteId;

    if (useV2) {
      const order = await updateSalesOrderV2(tenantId, id, body, user.id);
      return NextResponse.json(order);
    }

    const existing = await client.salesOrder.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    let totals: any = {};
    let lines: any[] = [];
    let hasLines = false;
    if (Array.isArray(body.lines)) {
      lines = body.lines.map(calcLine);
      hasLines = true;
      totals.subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      totals.discount = lines.reduce((s, l) => s + ((l.quantity * l.unitPrice) * (l.discount || 0)) / 100, 0);
      totals.tax = lines.reduce((s, l) => {
        const lineSubtotal = l.quantity * l.unitPrice;
        const afterDiscount = lineSubtotal - (lineSubtotal * (l.discount || 0)) / 100;
        return s + (afterDiscount * (l.tax || 0)) / 100;
      }, 0);
      totals.total = totals.subtotal - totals.discount + totals.tax;
      totals.grandTotal = body.grandTotal ?? totals.total;
      await client.legacySalesOrderLine.deleteMany({ where: { salesOrderId: id, tenantId } });
    }

    const order = await client.salesOrder.update({
      where: { id },
      data: {
        ...(body.orderNumber !== undefined && { number: body.orderNumber }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.customerId !== undefined && { customerId: body.customerId }),
        ...(body.orderDate !== undefined && { orderDate: body.orderDate ? new Date(body.orderDate) : new Date() }),
        ...(body.deliveryDate !== undefined && { deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
        ...(body.sourceQuotationId !== undefined && { sourceQuotationId: body.sourceQuotationId }),
        ...(hasLines ? totals : {}),
        ...(hasLines
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
      include: { customer: true, invoices: true, lines: true },
    });

    return NextResponse.json(mapLegacyOrder(order));
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = message.includes('Forbidden')
      ? 403
      : /approval|credit|threshold|inactive|invalid|exceed/i.test(message)
        ? 400
        : 500;
    return NextResponse.json(
      { error: status === 403 ? 'Forbidden' : status === 500 ? 'Failed to update order' : message || 'Invalid request' },
      { status }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  return PUT(request, ctx);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'delete' });
    const { id } = await params;
    const useV2 = ['1', 'true', 'v2'].includes((request.nextUrl.searchParams.get('v2') || '').toLowerCase());

    if (useV2) {
      const result = await deleteSalesOrderV2(tenantId, id);
      return NextResponse.json(result);
    }

    const existing = await client.salesOrder.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    await client.salesOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete order' }, { status });
  }
}
