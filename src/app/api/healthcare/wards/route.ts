import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const tenant = await getOrCreateDefaultTenant();
        const tenantId = tenant.id;

        const wards = await prisma.ward.findMany({
            where: { tenantId },
            include: {
                beds: {
                    include: {
                        admissions: {
                            where: { status: 'ADMITTED' },
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        patientNumber: true,
                                    },
                                },
                            },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Transform beds to include current admission and simplified status
        const transformedWards = wards.map((ward) => ({
            ...ward,
            beds: ward.beds.map((bed) => ({
                id: bed.id,
                bedNumber: bed.bedNumber,
                bedType: bed.bedType,
                dailyRate: bed.dailyRate,
                status: bed.status,
                currentAdmission: bed.admissions[0] || null,
            })),
        }));

        return NextResponse.json({ wards: transformedWards });
    } catch (error) {
        console.error('Error fetching wards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wards' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const tenant = await getOrCreateDefaultTenant();
        const tenantId = tenant.id;
        const data = await request.json();

        if (!data.name || !data.type) {
            return NextResponse.json(
                { error: 'Name and type are required' },
                { status: 400 }
            );
        }

        // Generate unique code from name
        const code = data.code || data.name.toUpperCase().replace(/\s+/g, '-').slice(0, 10) + '-' + Date.now().toString(36).slice(-4);

        const ward = await prisma.ward.create({
            data: {
                name: data.name,
                code,
                type: data.type,
                floor: data.floor || '1',
                capacity: data.capacity || 0,
                tenantId,
            },
        });

        return NextResponse.json(ward, { status: 201 });
    } catch (error) {
        console.error('Error creating ward:', error);
        return NextResponse.json(
            { error: 'Failed to create ward' },
            { status: 500 }
        );
    }
}
