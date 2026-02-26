import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';


export const dynamic = 'force-dynamic';
// GET /api/accounting/invoices - Get all invoices
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'accounting', action: 'view' });

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const customerId = searchParams.get('customerId');

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
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
    const { tenantId } = await requireTenantContext({ moduleId: 'accounting', action: 'create' });

    const body = await request.json();

    // Base validation for period locking
    const period = await prisma.accountingPeriod.findFirst({
      where: {
        id: body.periodId,
        tenantId
      }
    });

    if (!period) {
      return NextResponse.json({ error: 'Accounting period is required and must be valid' }, { status: 400 });
    }

    if (period.status === 'CLOSED') {
      return NextResponse.json({ error: 'Cannot post invoice to a closed accounting period' }, { status: 400 });
    }

    // Wrap the invoice creation and GL posting in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Compute totals server-side from lines if provided
      let computedSubtotal = Number(body.subtotal) || 0;
      let computedTax = Number(body.tax) || 0;
      let computedTotal = Number(body.total) || 0;

      const lineItems = Array.isArray(body.lines) ? body.lines : [];
      if (lineItems.length > 0) {
        computedSubtotal = lineItems.reduce((s: number, l: any) => s + (Number(l.quantity) * Number(l.unitPrice)), 0);
        computedTax = lineItems.reduce((s: number, l: any) => {
          const lineSub = Number(l.quantity) * Number(l.unitPrice);
          return s + (lineSub * (Number(l.tax) || 0)) / 100;
        }, 0);
        computedTotal = computedSubtotal + computedTax;
      }

      // 1. Create the Invoice with lines
      const newInvoice = await tx.invoice.create({
        data: {
          number: body.number,
          type: body.type || 'SALES',
          status: body.status || 'DRAFT',
          customerId: body.type === 'SALES' ? body.customerId : undefined,
          vendorId: body.type === 'PURCHASE' ? body.vendorId : undefined,
          salesOrderId: body.salesOrderId,
          periodId: body.periodId,
          currencyCode: body.currencyCode || 'LKR',
          exchangeRate: Number(body.exchangeRate || 1),
          baseCurrencyTotal: computedTotal * Number(body.exchangeRate || 1),
          issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
          dueDate: new Date(body.dueDate),
          subtotal: computedSubtotal,
          tax: computedTax,
          discount: body.discount || 0,
          total: computedTotal,
          amountPaid: 0,
          amountDue: computedTotal,
          notes: body.notes,
          terms: body.terms,
          tenantId,
          ...(lineItems.length > 0 && {
            lines: {
              create: lineItems.map((l: any) => ({
                description: l.description || 'Item',
                quantity: Number(l.quantity) || 1,
                unitPrice: Number(l.unitPrice) || 0,
                tax: Number(l.tax) || 0,
                discount: Number(l.discount) || 0,
                total: Number(l.total) || (Number(l.quantity) * Number(l.unitPrice)),
                ...(l.productId && { productId: l.productId }),
              })),
            },
          }),
        },
      });

      // 2. GL Posting Logic (only if status is OPEN)
      if (newInvoice.status === 'OPEN') {
        // Get system accounts (simplification: hardcoding codes that should exist via seeding)
        // AR = 1200, AP = 2000, Sales Revenue = 4000
        let arApCode = newInvoice.type === 'SALES' ? '1200' : '2000';
        let offsetCode = newInvoice.type === 'SALES' ? '4000' : '6000'; // Revenue or Expense

        const controlAccount = await tx.account.findFirst({ where: { tenantId, code: arApCode } });
        const offsetAccount = await tx.account.findFirst({ where: { tenantId, code: offsetCode } });

        if (controlAccount && offsetAccount) {
          const journalLines = [];
          const baseEquivalent = Number(newInvoice.total) * Number(newInvoice.exchangeRate);

          if (newInvoice.type === 'SALES') {
            // Debit AR, Credit Revenue
            journalLines.push({
              accountId: controlAccount.id,
              description: `AR for Invoice ${newInvoice.number}`,
              debit: newInvoice.total,
              credit: 0,
              currencyCode: newInvoice.currencyCode,
              exchangeRate: newInvoice.exchangeRate,
              baseCurrency: baseEquivalent
            });
            journalLines.push({
              accountId: offsetAccount.id,
              description: `Sales Revenue for Invoice ${newInvoice.number}`,
              debit: 0,
              credit: newInvoice.total - newInvoice.tax,
              currencyCode: newInvoice.currencyCode,
              exchangeRate: newInvoice.exchangeRate,
              baseCurrency: (newInvoice.total - newInvoice.tax) * newInvoice.exchangeRate
            });

            if (newInvoice.tax > 0) {
              // Need a Tax Liability account (Code 2100)
              const taxAccount = await tx.account.findFirst({ where: { tenantId, code: '2100' } });
              if (taxAccount) {
                journalLines.push({
                  accountId: taxAccount.id,
                  description: `Tax Liability for Invoice ${newInvoice.number}`,
                  debit: 0,
                  credit: newInvoice.tax,
                  currencyCode: newInvoice.currencyCode,
                  exchangeRate: newInvoice.exchangeRate,
                  baseCurrency: newInvoice.tax * newInvoice.exchangeRate
                });
              }
            }
          }

          // Post Journal Entry
          if (journalLines.length >= 2) {
            const je = await tx.journalEntry.create({
              data: {
                tenantId,
                periodId: newInvoice.periodId!,
                reference: `INV-${newInvoice.number}`,
                description: `Auto-posted from Invoice ${newInvoice.number}`,
                entryDate: newInvoice.issueDate,
                status: 'POSTED',
                lines: {
                  create: journalLines
                }
              }
            });

            // Link JE back to invoice
            await tx.invoice.update({
              where: { id: newInvoice.id },
              data: { journalEntryId: je.id }
            });
          }
        }
      }

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}


