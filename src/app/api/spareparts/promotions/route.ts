import { NextRequest, NextResponse } from 'next/server';
import { getPromotions, createPromotion } from '@/apps/spareparts/api';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const active = searchParams.get('active');

        const promotions = await getPromotions(user.tenantId, {
            active: active === 'true' ? true : active === 'false' ? false : undefined,
        });

        return NextResponse.json({ promotions });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch promotions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const promotion = await createPromotion({
            ...body,
            tenantId: user.tenantId,
        });

        return NextResponse.json(promotion, { status: 201 });
    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json(
            { error: 'Failed to create promotion' },
            { status: 500 }
        );
    }
}
