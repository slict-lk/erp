import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/accounting/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const method = searchParams.get('method') as any;

    const payments = await prisma.payment.findMany({
      where: {
        tenantId: tenant.id,
        ...(invoiceId && { invoiceId }),
        ...(method && { method }),
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/accounting/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const payment = await prisma.payment.create({
      data: {
        invoiceId: body.invoiceId,
        amount: body.amount,
        method: body.method || 'CASH',
        reference: body.reference,
        notes: body.notes,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        tenantId: tenant.id,
      },
      include: {
        invoice: true,
      },
    });

    // Update invoice amounts
    await prisma.invoice.update({
      where: { id: body.invoiceId },
      data: {
        amountPaid: { increment: body.amount },
        amountDue: { decrement: body.amount },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}


