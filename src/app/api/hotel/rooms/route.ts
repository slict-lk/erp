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
        ...(roomType && { roomType: roomType as any }),
      },
      include: {
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
    const { tenantId, roomNumber, roomType, floor, bedType, maxOccupancy, amenities, basePrice, description, images } = body;

    if (!tenantId || !roomNumber || !roomType || !basePrice) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const room = await prisma.hotelRoom.create({
      data: {
        tenantId, roomNumber, roomType, floor: floor || 1,
        bedType: bedType || 'Queen', maxOccupancy: maxOccupancy || 2,
        amenities: amenities || [], basePrice,
        description,
        images: images || [],
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
