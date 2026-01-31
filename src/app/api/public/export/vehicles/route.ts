
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/public/export/vehicles
export async function GET(request: NextRequest) {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.PUBLIC_API_KEY}` && process.env.PUBLIC_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let tenantId = searchParams.get('tenantId');
    const subdomain = searchParams.get('subdomain');
    const make = searchParams.get('make');
    const model = searchParams.get('model');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (!tenantId && !subdomain) {
        return NextResponse.json({ error: 'Tenant ID or Subdomain required' }, { status: 400 });
    }

    try {
        // If subdomain is provided, resolve it to tenantId
        if (!tenantId && subdomain) {
            const tenant = await prisma.tenant.findUnique({
                where: { subdomain },
                select: { id: true }
            });

            if (!tenant) {
                return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
            }
            tenantId = tenant.id;
        }

        const where: any = {
            tenantId,
            isPublished: true, // IMPORTANT: Only published vehicles
            // Filter by status if needed? Usually we show all published ones (IN_YARD, etc.)
            // But maybe not SOLD/DELIVERED?
            // Let's assume isPublished handles the "Visible" logic. 
        };

        if (make) where.make = { contains: make, mode: 'insensitive' };
        if (model) where.model = { contains: model, mode: 'insensitive' };
        if (minYear) where.year = { gte: parseInt(minYear) };
        if (maxYear) where.year = { lte: parseInt(maxYear) };

        const [vehicles, total] = await Promise.all([
            prisma.exportVehicle.findMany({
                where,
                take: parseInt(limit),
                skip: parseInt(offset),
                orderBy: { createdAt: 'desc' },
                include: {
                    photos: {
                        where: { isPublic: true },
                        take: 1, // Main photo
                    },
                },
            }),
            prisma.exportVehicle.count({ where }),
        ]);

        return NextResponse.json({
            data: vehicles.map(v => ({
                id: v.id,
                title: `${v.year} ${v.make} ${v.model}`,
                stockNumber: v.stockNumber,
                price: v.fobPrice, // Show FOB price
                currency: v.currency,
                mileage: v.mileage,
                fuel: v.fuelType,
                transmission: v.transmission,
                mainPhoto: v.photos[0]?.url || null,
                status: v.status,
            })),
            meta: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            }
        });
    } catch (error) {
        console.error('Error fetching public vehicles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
