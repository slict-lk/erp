import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';
// GET /api/restaurant/tables - List tables
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const client = prisma as any;

    const tables = await client.restaurantTable.findMany({
      where: {
        tenantId,
        ...(status && { status: status as any }),
      },
      include: {
        reservations: {
          where: {
            reservationDate: { gte: new Date() },
          },
          orderBy: { reservationDate: 'asc' },
          take: 5,
        },
      },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json(tables);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/restaurant/tables - Create table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId } = body;
    const tableNumber = body.tableNumber ?? body.number;
    const capacity = body.capacity;
    const location = body.location;

    if (!tenantId || !tableNumber || !capacity) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const client = prisma as any;

    const table = await client.restaurantTable.create({
      data: {
        tenantId,
        number: tableNumber,
        capacity,
        location,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

