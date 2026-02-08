import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
// GET /api/hotel/rooms - List hotel rooms
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');
    const roomType = searchParams.get('roomType');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const rooms = await prisma.hotelRoom.findMany({
      where: {
        tenantId,
        ...(status && { status: status as any }),
        // Support searching by string type or ID
        ...(roomType && {
          OR: [
            { roomType: roomType },
            { type: { name: roomType } }
          ]
        }),
      },
      include: {
        type: true, // Include the RoomType details
        bookings: {
          where: {
            checkIn: { gte: new Date() },
          },
          orderBy: { checkIn: 'asc' },
          take: 3,
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/hotel/rooms - Create room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId, roomNumber,
      roomTypeId, // New Relation
      roomType, floor, bedType, maxOccupancy, amenities, basePrice, description, images
    } = body;

    // Validate
    if (!tenantId || !roomNumber) {
      return NextResponse.json({ error: 'Tenant ID and Room Number are required' }, { status: 400 });
    }

    // Logic: If roomTypeId is provided, link it. 
    // If not, use legacy fields (but we encourage using Types now)

    // We can fetch the type to fill in legacy fields if they are missing
    let legacyData = { roomType, width: 0 };
    if (roomTypeId && !roomType) {
      const type = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
      if (type) {
        legacyData.roomType = type.name;
      }
    }

    const room = await prisma.hotelRoom.create({
      data: {
        tenantId,
        roomNumber,
        roomTypeId,
        floor: floor || 1,
        status: 'AVAILABLE',

        // Legacy / Fallback fields
        roomType: legacyData.roomType || roomType || 'Standard',
        basePrice: basePrice || 0, // Should come from Type ideally
        maxOccupancy: maxOccupancy || 2,
        amenities: amenities || [],
        description: description,
        images: images || [],
        bedType: bedType || 'Queen',
      },
      include: {
        type: true
      }
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
