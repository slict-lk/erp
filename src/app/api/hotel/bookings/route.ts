import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const roomId = searchParams.get('roomId');
        const status = searchParams.get('status');

        if (!tenantId) {
            // In a real app we'd get tenant from session, but for now allow param
            // or if authenticated via middleware, we might need to extract it differently.
            // Assuming param for consistency with other internal APIs
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const where: any = { tenantId };
        if (roomId) where.roomId = roomId;
        if (status) where.status = status;

        const bookings = await prisma.hotelBooking.findMany({
            where,
            include: {
                room: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(bookings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
