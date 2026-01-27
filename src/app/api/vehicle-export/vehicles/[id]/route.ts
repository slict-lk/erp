import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/vehicle-export/vehicles/[id] - Vehicle detail
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const vehicle = await prisma.exportVehicle.findFirst({
            where: { id, tenantId: session.user.tenantId },
            include: {
                customer: true,
                shipment: true,
                photos: true,
                bids: {
                    include: { customer: true },
                    orderBy: { createdAt: 'desc' },
                },
                yardJobs: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json({ vehicle });
    } catch (error) {
        console.error('Vehicle fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
    }
}

// PUT /api/vehicle-export/vehicles/[id] - Update vehicle
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Build update data
        const updateData: any = {};

        // Vehicle details
        const allowedFields = [
            'make', 'model', 'year', 'month', 'engineCode', 'fuelType',
            'color', 'transmission', 'mileage', 'engineCc', 'location',
            'status', 'fobPrice', 'cifPrice', 'isPublished',
            'shakenStatus', 'mashoStatus', 'jaaiStatus',
            'exportCertUrl', 'jaaiCertUrl',
            'taxAmount', 'dutyAmount', 'shippingCost',
            'customerId', 'shipmentId',
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        const vehicle = await prisma.exportVehicle.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
                shipment: true,
            },
        });

        return NextResponse.json({ vehicle });
    } catch (error) {
        console.error('Vehicle update error:', error);
        return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }
}
