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

        const warehouse = await prisma.invWarehouse.findUnique({
            where: {
                id: params.id,
                tenantId: tenant.id
            },
            include: {
                stockLedgers: {
                    include: {
                        product: true
                    }
                },
                stockMovements: {
                    orderBy: { date: 'desc' },
                    take: 10,
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!warehouse) {
            return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
        }

        return NextResponse.json(warehouse);
    } catch (error) {
        console.error('Error fetching warehouse details:', error);
        return NextResponse.json({ error: 'Failed to fetch warehouse details' }, { status: 500 });
    }
}
