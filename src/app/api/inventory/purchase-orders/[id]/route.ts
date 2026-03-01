import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const tenant = await getOrCreateDefaultTenant();

        const po = await prisma.purchaseOrder.findUnique({
            where: {
                id: params.id,
                tenantId: tenant.id
            },
            include: {
                vendor: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!po) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
        }

        return NextResponse.json(po);
    } catch (error) {
        console.error('Error fetching purchase order:', error);
        return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 });
    }
}
