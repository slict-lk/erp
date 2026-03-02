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

        const po = await prisma.invPurchaseOrder.findUnique({
            where: {
                id: params.id,
                tenantId: tenant.id
            },
            include: {
                supplier: true,
                lines: {
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

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const tenant = await getOrCreateDefaultTenant();
        const body = await request.json();

        // Check if the PO exists and belongs to the tenant
        const existingPo = await prisma.invPurchaseOrder.findUnique({
            where: {
                id: params.id,
                tenantId: tenant.id
            }
        });

        if (!existingPo) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
        }

        const updatedPo = await prisma.invPurchaseOrder.update({
            where: {
                id: params.id,
                tenantId: tenant.id
            },
            data: {
                status: body.status !== undefined ? body.status : existingPo.status,
                expectedAt: body.expectedAt ? new Date(body.expectedAt) : existingPo.expectedAt,
                notes: body.notes !== undefined ? body.notes : existingPo.notes
            }
        });

        return NextResponse.json(updatedPo);
    } catch (error) {
        console.error('Error updating purchase order:', error);
        return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 });
    }
}
