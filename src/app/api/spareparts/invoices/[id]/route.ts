import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/spareparts/invoices/[id] - Get invoice details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        console.log('Fetching invoice with ID:', id);

        const invoice = await (prisma as any).shopInvoice.findFirst({
            where: {
                id,
                tenantId: user.tenantId,
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
                items: {
                    select: {
                        id: true,
                        productName: true,
                        productSku: true,
                        quantity: true,
                        unitPrice: true,
                        discountPercent: true,
                        discountAmount: true,
                        lineTotal: true,
                    },
                },
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        method: true,
                        createdAt: true,
                    },
                },
            },
        });

        console.log('Invoice fetched:', invoice);
        console.log('Items count:', invoice?.items?.length);

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}
