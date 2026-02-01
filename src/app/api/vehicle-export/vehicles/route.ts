import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/vehicle-export/vehicles - List vehicles (Module C)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where: any = { tenantId };

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { stockNumber: { contains: search, mode: 'insensitive' } },
                { chassisNumber: { contains: search, mode: 'insensitive' } },
                { make: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
            ];
        }

        const vehicles = await prisma.exportVehicle.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, name: true, country: true },
                },
                photos: {
                    take: 1,
                    select: { url: true },
                },
                _count: {
                    select: { yardJobs: true, bids: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ vehicles });
    } catch (error) {
        console.error('Vehicles fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }
}

// POST /api/vehicle-export/vehicles - Create vehicle from auction (REQ-C1)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = session.user.tenantId;
        const body = await request.json();

        // Generate stock number
        const year = new Date().getFullYear();
        const prefix = `SL-${year}-`;
        // Use global sequence (remove tenantId filter) to avoid unique constraint violations
        const lastVehicle = await prisma.exportVehicle.findFirst({
            where: { stockNumber: { startsWith: prefix } },
            orderBy: { stockNumber: 'desc' },
        });

        let sequence = 1;
        if (lastVehicle) {
            const lastSeq = parseInt(lastVehicle.stockNumber.split('-')[2], 10);
            sequence = lastSeq + 1;
        }
        const stockNumber = `${prefix}${String(sequence).padStart(4, '0')}`;

        // Create vehicle
        const vehicle = await prisma.exportVehicle.create({
            data: {
                tenantId,
                stockNumber,
                chassisNumber: body.chassisNumber,
                make: body.make,
                model: body.model,
                year: body.year,
                month: body.month,
                engineCode: body.engineCode,
                engineCc: body.engineCc, // Added
                fuelType: body.fuelType,
                color: body.color,
                transmission: body.transmission,
                mileage: body.mileage,
                purchasePrice: body.purchasePrice,
                auctionHouse: body.auctionHouse,
                auctionDate: body.auctionDate ? new Date(body.auctionDate) : null,
                lotNumber: body.lotNumber,
                auctionGrade: body.auctionGrade,
                auctionFee: body.auctionFee || 0,
                customerId: body.customerId,
                status: 'WON_AT_AUCTION',
                photos: body.photos && body.photos.length > 0 ? {
                    create: body.photos.map((url: string) => ({
                        url,
                        tag: 'Auction',
                        isPublic: true,
                    }))
                } : undefined,
            },
        });

        // Auto-create yard inspection job (REQ-D1)
        await prisma.yardJob.create({
            data: {
                tenantId,
                vehicleId: vehicle.id,
                title: 'Initial Inspection',
                type: 'INSPECTION_PREP',
                status: 'TODO',
                notes: body.inspectionNotes || 'Inspect vehicle upon arrival at yard',
                proofPhotos: [],
            },
        });

        return NextResponse.json({ vehicle }, { status: 201 });
    } catch (error) {
        console.error('Vehicle create error:', error);
        return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }
}
