import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/accounting/invoices - Get all invoices
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();

    // Check permissions
    const { requirePermission } = await import('@/lib/auth');
    await requirePermission('accounting', 'view');

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const customerId = searchParams.get('customerId');

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        ...(statusParam && { status: statusParam as any }),
        ...(typeParam && { type: typeParam as any }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: true,
        salesOrder: true,
        lines: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    if (error.message === 'Forbidden: Insufficient Permissions') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST /api/accounting/invoices - Create new invoice
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();

    // Check permissions
    const { requirePermission } = await import('@/lib/auth');
    await requirePermission('accounting', 'create');

    const body = await request.json();

    const invoice = await prisma.invoice.create({
      data: {
        number: body.number,
        type: body.type || 'SALES',
        status: body.status || 'DRAFT',
        customerId: body.customerId,
        salesOrderId: body.salesOrderId,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        dueDate: new Date(body.dueDate),
        subtotal: body.subtotal,
        tax: body.tax || 0,
        discount: body.discount || 0,
        total: body.total,
        amountPaid: 0,
        amountDue: body.total,
        notes: body.notes,
        terms: body.terms,
        tenantId: tenant.id,
      },
      include: {
        customer: true,
        lines: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}


