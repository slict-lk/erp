import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    description: line.description ?? 'Item',
    quantity,
    unitPrice,
    discount,
    tax,
    lineTotal: afterDiscount + lineTax,
  };
}

function mapQuotation(q: any) {
  return {
    ...q,
    quoteNumber: q.number,
    quotationNumber: q.number,
    total: q.total ?? q.grandTotal,
    lines: (q.lines || []).map((l: any) => ({
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { id } = await params;
    const q = await client.quotation.findFirst({
      where: { id, tenantId },
      include: { customer: true, lines: true },
    });
    if (!q) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    return NextResponse.json(mapQuotation(q));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch quotation' }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    const { id } = await params;
    const body = await request.json();
    const existing = await client.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });

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
      await client.legacyQuotationLine.deleteMany({ where: { quotationId: id, tenantId } });
    }

    const q = await client.quotation.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.customerId !== undefined && { customerId: body.customerId }),
        ...(body.validUntil !== undefined && { validUntil: body.validUntil ? new Date(body.validUntil) : null }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.termsAndConditions !== undefined && { termsAndConditions: body.termsAndConditions }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.quoteNumber !== undefined && { number: body.quoteNumber }),
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
      include: { customer: true, lines: true },
    });

    return NextResponse.json(mapQuotation(q));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to update quotation' }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'delete' });
    const { id } = await params;
    const existing = await client.quotation.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    await client.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete quotation' }, { status });
  }
}
