import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/vehicle-export/bids/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const bid = await prisma.exportBid.findFirst({
            where: { id, tenantId: session.user.tenantId },
            include: {
                customer: true,
                vehicle: true,
            },
        });

        if (!bid) {
            return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
        }

        return NextResponse.json({ bid });
    } catch (error) {
        console.error('Bid fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch bid' }, { status: 500 });
    }
}

// PUT /api/vehicle-export/bids/[id] - Approve/Reject bid (REQ-B2)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, adminNotes, approvedPrice } = body;

        // Validate status
        const validStatuses = ['APPROVED', 'REJECTED', 'WON', 'LOST'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updateData: any = {
            status,
            adminNotes,
        };

        if (approvedPrice !== undefined) {
            updateData.approvedPrice = approvedPrice;
        }

        const bid = await prisma.exportBid.update({
            where: { id },
            data: updateData,
            include: { customer: true },
        });

        return NextResponse.json({ bid });
    } catch (error) {
        console.error('Bid update error:', error);
        return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 });
    }
}
