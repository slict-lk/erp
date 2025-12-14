import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const booking = await prisma.hotelBooking.findUnique({
            where: { id },
            include: {
                room: {
                    select: {
                        roomNumber: true,
                        roomType: true,
                        basePrice: true,
                    }
                },
                folioCharges: {
                    orderBy: { chargedAt: 'desc' },
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Ensure we send back calculated totals if needed, though UI does it too
        return NextResponse.json(booking);
    } catch (error) {
        console.error('Failed to fetch folio:', error);
        return NextResponse.json(
            { error: 'Failed to fetch folio' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { type, description, amount, quantity } = body;

        // Fetch booking to get tenantId
        const booking = await prisma.hotelBooking.findUnique({
            where: { id },
            select: { tenantId: true }
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const charge = await prisma.folioCharge.create({
            data: {
                bookingId: id,
                chargeType: type,
                description,
                amount,
                quantity: quantity || 1,
                tenantId: booking.tenantId
            }
        });

        // Also update totalAmount in booking if needed? 
        // Typically PMS keeps room rate and extras separate, but let's update totalAmount for easy query
        // Actually, let's NOT update totalAmount to keep it as room revenue, and calculating total bill on fly.
        // OR: Update totalAmount to be inclusive of all? 
        // Answer: usually better to keep totalAmount as the "Room Rate Total", and calculate bill dynamically.
        // However, for simplicity in `payment` logic, sometimes beneficial to update `totalAmount`.
        // Let's decide to keep `totalAmount` strictly as Room Revenue for now.
        // But for "Balance Due" logic in simple lists, we might want to know total bill. 
        // Use a computed field? No. Let's stick to on-the-fly calc in UI/API for now.

        return NextResponse.json(charge);
    } catch (error) {
        console.error('Failed to add charge:', error);
        return NextResponse.json(
            { error: 'Failed to add charge' },
            { status: 500 }
        );
    }
}
