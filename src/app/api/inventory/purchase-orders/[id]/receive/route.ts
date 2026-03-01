import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { recordStockIn, recordStockOut } from '@/lib/inventory/inventory-bridge';

export const dynamic = 'force-dynamic';

// POST /api/inventory/purchase-orders/[id]/receive
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const params = await context.params;
        const tenant = await getOrCreateDefaultTenant();
        const body = await request.json();
        const { destinationWarehouseId, linesToReceive } = body;
        // linesToReceive: Array<{ lineId: string, quantity: number }>

        if (!destinationWarehouseId || !linesToReceive || !Array.isArray(linesToReceive)) {
            return NextResponse.json({ error: 'Invalid payload. Requires destinationWarehouseId and linesToReceive array.' }, { status: 400 });
        }

        const order = await prisma.purchaseOrder.findUnique({
            where: { id: params.id, tenantId: tenant.id },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
        }

        if (order.status === 'RECEIVED' || order.status === 'CANCELLED') {
            return NextResponse.json({ error: `Cannot receive stock for order in ${order.status} status` }, { status: 400 });
        }

        // Doing bridge calls outside a Prisma transaction to avoid nested tx deadlocks on Prisma:
        let allFullyReceived = true;
        const successfullyReceivedLines = [];

        try {
            for (const rLine of linesToReceive) {
                const dbLine = order.items.find(l => l.id === rLine.lineId);
                if (!dbLine) continue;

                const receiveQty = Number(rLine.quantity);
                if (receiveQty <= 0) {
                    allFullyReceived = false;
                    continue;
                }

                const cumulative = ((dbLine as any).receivedQuantity || 0) + receiveQty;
                if (cumulative < dbLine.quantity) {
                    allFullyReceived = false;
                }

                const cappedCumulative = Math.min(cumulative, dbLine.quantity);
                const actualReceivedThisTime = cappedCumulative - ((dbLine as any).receivedQuantity || 0);

                if (actualReceivedThisTime <= 0) {
                    continue;
                }

                // Update DB Line immediately
                const prevReceivedQuantity = ((dbLine as any).receivedQuantity || 0);
                await (prisma.purchaseOrderItem as any).update({
                    where: { id: dbLine.id },
                    data: { receivedQuantity: cappedCumulative }
                });

                // Call bridge
                await recordStockIn('IN', {
                    tenantId: tenant.id,
                    productId: dbLine.productId,
                    warehouseId: destinationWarehouseId,
                    quantity: actualReceivedThisTime,
                    unitCost: Number(dbLine.unitPrice), // Crucial for moving average recalculation
                    sourceModule: 'inventory',
                    sourceDocument: order.id,
                    reference: order.orderNumber,
                    notes: `PO Receipt`
                });

                successfullyReceivedLines.push({
                    id: dbLine.id, // Capture id
                    productId: dbLine.productId,
                    quantity: actualReceivedThisTime,
                    receivedQuantity: cappedCumulative,
                    prevReceivedQuantity, // Capture old val
                    unitCost: Number(dbLine.unitPrice)
                });
            }
        } catch (error) {
            console.error('Error during PO receiving, initiating compensation rollback', error);
            const failedProductIds = [];

            for (const line of successfullyReceivedLines) {
                let success = false;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        await recordStockOut('OUT', {
                            tenantId: tenant.id,
                            productId: line.productId,
                            warehouseId: destinationWarehouseId,
                            quantity: line.quantity,
                            unitCost: line.unitCost,
                            sourceModule: 'inventory',
                            sourceDocument: order.id,
                            reference: `ROLLBACK-${order.orderNumber}`
                        });

                        // Revert receivedQuantity
                        await (prisma.purchaseOrderItem as any).update({
                            where: { id: line.id },
                            data: { receivedQuantity: line.prevReceivedQuantity }
                        });

                        success = true;
                        break;
                    } catch (e) {
                        console.error(`Rollback attempt ${attempt} failed for product ${line.productId}`);
                        if (attempt < 3) await new Promise(res => setTimeout(res, 500));
                    }
                }
                if (!success) {
                    failedProductIds.push(line.productId);
                }
            }
            if (failedProductIds.length > 0) {
                throw new Error(`Transaction failed and was rolled back. CRITICAL: Manual cleanup required for product IDs: ${failedProductIds.join(', ')}`);
            }
            throw new Error('Transaction failed and was rolled back');
        }

        // Update main order status
        const newStatus = allFullyReceived ? 'RECEIVED' : 'PARTIAL';
        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id: order.id },
            data: {
                status: newStatus
            }
        });

        // TODO: GL POSTING (Phase 6) 
        // Debit Inventory Asset, Credit Accounts Payable if received.

        return NextResponse.json(updatedOrder, { status: 200 });

    } catch (error: any) {
        console.error('Error receiving PO stock:', error);
        return NextResponse.json({ error: error.message || 'Failed to receive stock' }, { status: 500 });
    }
}
