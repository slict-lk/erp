
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
        }

        // 3. Create Bid
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
