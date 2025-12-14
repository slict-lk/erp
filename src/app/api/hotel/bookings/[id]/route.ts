import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET /api/hotel/bookings/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const booking = await prisma.hotelBooking.findUnique({
            where: { id },
            include: { room: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/hotel/bookings/[id] - Update Status (Check-In/Out)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updateData: any = {
            status: body.status,
            updatedAt: new Date(),
        };

        // Handle Check-In specific fields
        if (body.status === 'CHECKED_IN') {
            updateData.checkedInAt = body.checkedInAt ? new Date(body.checkedInAt) : new Date();
            updateData.checkedInBy = body.checkedInBy;
            updateData.idVerified = body.idVerified;
            updateData.paymentMethod = body.paymentMethod;
            updateData.depositAmount = body.depositAmount;

            // Also log this action
            const action = await prisma.frontDeskAction.create({
                data: {
                    bookingId: id,
                    actionType: 'CHECK_IN',
                    performedBy: body.checkedInBy || 'Unknown',
                    tenantId: (await prisma.hotelBooking.findUnique({ where: { id }, select: { tenantId: true } }))?.tenantId || '',
                    details: {
                        paymentMethod: body.paymentMethod,
                        deposit: body.depositAmount
                    }
                }
            });
        }

        // Handle Check-Out specific fields
        if (body.status === 'CHECKED_OUT') {
            updateData.checkedOutAt = body.checkedOutAt ? new Date(body.checkedOutAt) : new Date();

            // Mark room as dirty for housekeeping
            const booking = await prisma.hotelBooking.findUnique({ where: { id } });
            if (booking) {
                await prisma.hotelRoom.update({
                    where: { id: booking.roomId },
                    data: { housekeepingStatus: 'DIRTY' }
                });
            }
        }

        const booking = await prisma.hotelBooking.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/hotel/bookings/[id] - Update Details
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const booking = await prisma.hotelBooking.update({
            where: { id },
            data: {
                status: body.status,
                specialRequests: body.specialRequests,
                checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
                checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
                guestProfileId: body.guestProfileId,
            },
        });

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/hotel/bookings/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        await prisma.hotelBooking.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
