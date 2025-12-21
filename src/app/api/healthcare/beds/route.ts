import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const tenant = await getOrCreateDefaultTenant();
        const tenantId = tenant.id;

        const beds = await prisma.hospitalBed.findMany({
            where: { tenantId },
            include: {
                ward: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
            orderBy: { bedNumber: 'asc' },
        });

        return NextResponse.json({ beds });
    } catch (error) {
        console.error('Error fetching beds:', error);
        return NextResponse.json(
            { error: 'Failed to fetch beds' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const tenant = await getOrCreateDefaultTenant();
        const tenantId = tenant.id;
        const data = await request.json();

        if (!data.bedNumber || !data.wardId) {
            return NextResponse.json(
                { error: 'Bed number and ward ID are required' },
                { status: 400 }
            );
        }

        const bed = await prisma.hospitalBed.create({
            data: {
                bedNumber: data.bedNumber,
                bedType: data.bedType || 'STANDARD',
                dailyRate: data.dailyRate || 0,
                status: 'AVAILABLE',
                wardId: data.wardId,
                tenantId,
            },
        });

        return NextResponse.json(bed, { status: 201 });
    } catch (error) {
        console.error('Error creating bed:', error);
        return NextResponse.json(
            { error: 'Failed to create bed' },
            { status: 500 }
        );
    }
}
