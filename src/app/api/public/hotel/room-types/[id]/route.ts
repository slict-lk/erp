import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        const roomType = await prisma.roomType.findUnique({
            where: { id },
            include: {
                rooms: {
                    select: { id: true, roomNumber: true, status: true }
                }
            }
        });

        if (!roomType) {
            return NextResponse.json({ error: 'Room type not found' }, { status: 404 });
        }

        if (tenantId && roomType.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(roomType);
    } catch (error: any) {
        console.error('Error fetching room type:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
