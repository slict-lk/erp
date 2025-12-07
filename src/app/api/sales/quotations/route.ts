import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/sales/quotations - Get all quotations
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const client = prisma as any;

    const quotations = await client.quotation.findMany({
      where: {
        tenantId: tenant.id,
        ...(statusParam && { status: statusParam as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' }),
        ...(customerId && { customerId }),
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/sales/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const quotation = await prisma.quotation.create({
      data: {
        number: body.quoteNumber || `QT-${Date.now()}`,
        status: (body.status as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED') || 'DRAFT',
        validUntil: body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        customerId: body.customerId,
        tax: body.tax || 0,
        discount: body.discount || 0,
        total: body.total,
        grandTotal: body.grandTotal ?? body.total,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}

