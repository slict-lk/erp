import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            tenantId,
            roomId,
            rateName,
            price,
            guestName,
            guestEmail,
            guestPhone,
            checkIn,
            checkOut,
            guests
        } = body;

        // 1. Basic Validation
        if (!tenantId || !roomId || !rateName || price === undefined || !guestName || !checkIn || !checkOut) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const lengthOfStay = differenceInDays(endDate, startDate);

        if (lengthOfStay <= 0) {
            return NextResponse.json(
                { error: 'Invalid dates' },
                { status: 400 }
            );
        }

        // 2. Fetch Room & Current Base Price
        const room = await prisma.hotelRoom.findUnique({
            where: { id: roomId },
        });

        if (!room || room.tenantId !== tenantId) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // 3. RE-VERIFY PRICE (Security Step)
        // We must recalculate the price to ensure the user didn't modify it in the frontend.
        const totalStandardPrice = room.basePrice * lengthOfStay;
        let expectedPrice = totalStandardPrice;

        if (rateName.includes('Member Rate')) {
            // Apply Member Discount Logic (Must match GET logic exactly)
            const memberDiscount = 0.15;
            expectedPrice = Math.round(totalStandardPrice * (1 - memberDiscount));
        } else if (rateName === 'Flexible Rate') {
            expectedPrice = totalStandardPrice;
        } else {
            // Unknown rate plan
            return NextResponse.json(
                { error: 'Invalid Rate Plan selected' },
                { status: 400 }
            );
        }

        // Allow small floating point margin of error (e.g., 1 unit)
        if (Math.abs(expectedPrice - price) > 1) {
            return NextResponse.json(
                { error: `Price mismatch. Expected ${expectedPrice} but received ${price}. Please refresh and try again.` },
                { status: 400 }
            );
        }

        // 4. Check Availability (Prevent Double Booking)
        const existingBooking = await prisma.hotelBooking.findFirst({
            where: {
                roomId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                AND: [
                    { checkIn: { lt: endDate } },
                    { checkOut: { gt: startDate } },
                ],
            },
        });

        if (existingBooking) {
            return NextResponse.json(
                { error: 'Room is no longer available for these dates.' },
                { status: 409 }
            );
        }

        // 5. Create Booking
        const bookingNumber = `BK-${Date.now().toString().slice(-6)}`; // Simple generator

        // Check if Guest Email exists (Optional CRM link - skipping for now to keep headless simple)

        const newBooking = await prisma.hotelBooking.create({
            data: {
                tenantId,
                roomId,
                bookingNumber,
                guestName,
                guestEmail,
                checkIn: startDate,
                checkOut: endDate,
                nights: lengthOfStay,
                guests: guests || 1,
                totalAmount: expectedPrice, // ALWAYS use the Verified Price
                status: 'CONFIRMED',
                specialRequests: `Rate Plan: ${rateName}`, // Store the rate name for reference
            },
        });

        return NextResponse.json(
            {
                bookingNumber: newBooking.bookingNumber,
                status: newBooking.status,
                message: 'Booking confirmed successfully'
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        );
    }
}
