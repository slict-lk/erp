import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/public/hotel/experiences
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const category = searchParams.get('category');
        const activeOnly = searchParams.get('activeOnly') !== 'false';

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const where: any = { tenantId };
        if (activeOnly) where.isActive = true;
        if (category) where.category = category;

        const experiences = await prisma.experience.findMany({
            where,
            include: {
                _count: {
                    select: { bookings: true }
                }
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
        });

        return NextResponse.json(experiences);
    } catch (error: any) {
        console.error('Error fetching experiences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
