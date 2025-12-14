import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const branchId = searchParams.get('branchId'); // Optional branch filter
        const checkIn = searchParams.get('checkIn');
        const checkOut = searchParams.get('checkOut');
        const guests = parseInt(searchParams.get('guests') || '1');

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Tenant ID is required' },
                { status: 400 }
            );
        }

        if (!checkIn || !checkOut) {
            return NextResponse.json(
                { error: 'Check-in and Check-out dates are required' },
                { status: 400 }
            );
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);
        const lengthOfStay = differenceInDays(endDate, startDate);

        if (lengthOfStay <= 0) {
            return NextResponse.json(
                { error: 'Check-out date must be after check-in date' },
                { status: 400 }
            );
        }

        // Build room filter (optionally filter by branch)
        const roomFilter: any = {
            tenantId,
            maxOccupancy: { gte: guests },
            status: 'AVAILABLE',
        };

        if (branchId) {
            roomFilter.branchId = branchId;
        }

        // 1. Fetch Rooms that match capacity (optionally filtered by branch)
        const allRooms = await prisma.hotelRoom.findMany({
            where: roomFilter,
        });

        // 2. Check Availability (Exclude booked rooms)
        // Find bookings that overlap with requested dates
        const existingBookings = await prisma.hotelBooking.findMany({
            where: {
                tenantId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                AND: [
                    { checkIn: { lt: endDate } },
                    { checkOut: { gt: startDate } },
                ],
            },
            select: { roomId: true },
        });

        const bookedRoomIds = new Set(existingBookings.map((b) => b.roomId));

        // Filter out booked rooms
        const availableRooms = allRooms.filter((room) => !bookedRoomIds.has(room.id));

        // 3. Rate Calculation Engine
        const roomsWithRates = availableRooms.map((room) => {
            // Base Price Logic (Simple for now, can be extended for seasonality)
            const nightlyPrice = room.basePrice;
            const totalStandardPrice = nightlyPrice * lengthOfStay;

            // Rate Plan 1: Standard / Flexible
            const standardRate = {
                name: 'Flexible Rate',
                price: totalStandardPrice,
                strikePrice: Math.round(totalStandardPrice * 1.1), // Fake "Was" price
                isMember: false,
                perks: ['Free cancellation until 48h before check-in', 'Pay at hotel'],
            };

            // Rate Plan 2: Member Rate (15% Off)
            const memberDiscount = 0.15;
            const memberPrice = Math.round(totalStandardPrice * (1 - memberDiscount));
            const memberRate = {
                name: 'Member Rate - Room Only',
                price: memberPrice,
                strikePrice: totalStandardPrice,
                isMember: true,
                perks: ['Save 15% instantly', 'Preferred Room Allocation', 'Late Checkout (subject to availability)'],
            };

            return {
                id: room.id,
                roomType: room.roomType,
                description: room.description || `A comfortable ${room.roomType.toLowerCase()} room.`,
                maxOccupancy: room.maxOccupancy,
                images: room.images.length > 0 ? room.images : ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop'], // Fallback image
                amenities: room.amenities,
                rates: [memberRate, standardRate], // Member rate first as it's the "Deal"
            };
        });

        return NextResponse.json(roomsWithRates);
    } catch (error: any) {
        console.error('Error fetching public rooms:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rooms' },
            { status: 500 }
        );
    }
}
