import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/vehicle-export/wallet/transactions/[id] - Verify/Update transaction status
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Security: Only Admins can approve/reject transactions
        if (session.user.role !== 'ADMIN' && !session.user.isSuperAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, adminNote } = body;

        if (!status || !['PENDING', 'CLEARED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // First get the transaction to access wallet info
        const existingTx = await (prisma as any).exportWalletTransaction.findFirst({
            where: { id },
            include: { wallet: true },
        });

        if (!existingTx) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Use transaction to update both transaction status and wallet balance
        const result = await prisma.$transaction(async (tx: any) => {
            // Update transaction status
            const updatedTx = await tx.exportWalletTransaction.update({
                where: { id },
                data: {
                    status,
                    adminNote
                },
            });

            // If clearing a deposit, update wallet balance
            if (status === 'CLEARED' && existingTx.status === 'PENDING' && existingTx.type === 'DEPOSIT') {
                await tx.exportWallet.update({
                    where: { id: existingTx.walletId },
                    data: {
                        balance: {
                            increment: existingTx.amount,
                        },
                    },
                });
            }

            return updatedTx;
        });


        return NextResponse.json({ transaction: result });
    } catch (error) {
        console.error('Transaction update error:', error);
        return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }
}
