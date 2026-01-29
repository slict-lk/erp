
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/public/export/bids
export async function POST(request: NextRequest) {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.PUBLIC_API_KEY}` && process.env.PUBLIC_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { tenantId, vehicleId, customerEmail, customerName, customerPhone, customerCountry, amount, message } = body;

        if (!tenantId || !customerEmail || !amount) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Find or Create Customer
        // Using findFirst because email might not be unique across tenants in schema?
        // Actually, schema says @@index([tenantId]), @@index([email]) but schema update for ExportCustomer didn't enforce unique email globally. 
        // We'll trust the logic: find in this tenant.
        let customer = await prisma.exportCustomer.findFirst({
            where: { tenantId, email: customerEmail },
        });

        if (!customer) {
            customer = await prisma.exportCustomer.create({
                data: {
                    tenantId,
                    email: customerEmail,
                    name: customerName || customerEmail.split('@')[0],
                    phone: customerPhone,
                    country: customerCountry,
                },
            });

            // Create default wallet if not exists (for new customers)
            await (prisma as any).exportWallet.create({
                data: {
                    customerId: customer.id,
                    tenantId,
                    balance: 0,
                }
            });
        }

        // 3. Check Store Config for Deposit Requirement
        const storeConfig = await (prisma as any).exportStoreConfig.findUnique({
            where: { tenantId }
        });

        const requireDeposit = storeConfig?.requireDeposit ?? true;
        const minimumDeposit = storeConfig?.minimumDeposit ?? 1000;

        // 4. Wallet Validation (Only if deposit is required)
        if (requireDeposit) {
            const wallet = await (prisma as any).exportWallet.findUnique({
                where: { customerId: customer.id }
            });

            if (!wallet || Number(wallet.balance) < Number(minimumDeposit)) {
                return NextResponse.json({
                    error: `Insufficient Security Deposit. Minimum $${minimumDeposit} required.`,
                    code: 'INSUFFICIENT_FUNDS',
                    currentBalance: wallet?.balance || 0,
                    required: minimumDeposit
                }, { status: 402 }); // Payment Required
            }
        }


        // 4. Create Bid
        const bid = await prisma.exportBid.create({
            data: {
                tenantId,
                customerId: customer.id,
                vehicleId: vehicleId || null, // Can be general inquiry if null
                requestedMake: body.make || 'Any',
                requestedModel: body.model || 'Any',
                maxBudget: parseFloat(amount),
                notes: message,
                status: 'PENDING',
            },
        });

        return NextResponse.json({ success: true, bidId: bid.id });

    } catch (error) {
        console.error('Error creating public bid:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
