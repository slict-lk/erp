import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';
import { PeriodStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext({ moduleId: 'accounting', action: 'view' });

        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get('status') as PeriodStatus | null;
        const yearParam = searchParams.get('year');

        const periods = await prisma.accountingPeriod.findMany({
            where: {
                tenantId,
                ...(statusParam && { status: statusParam }),
                ...(yearParam && { year: parseInt(yearParam) }),
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
            ],
        });

        return NextResponse.json(periods);
    } catch (error: any) {
        if (error.message === 'Forbidden: Insufficient Permissions') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.error('Error fetching periods:', error);
        return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext({ moduleId: 'accounting', action: 'create' });
        const body = await request.json();

        // Check if period already exists for this year/month
        const existing = await prisma.accountingPeriod.findUnique({
            where: {
                tenantId_year_month: {
                    tenantId,
                    year: body.year,
                    month: body.month,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'An accounting period already exists for this year and month.' },
                { status: 400 }
            );
        }

        const period = await prisma.accountingPeriod.create({
            data: {
                tenantId,
                name: body.name || `${body.year}-${String(body.month).padStart(2, '0')}`,
                year: body.year,
                month: body.month,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                status: 'OPEN',
            },
        });

        return NextResponse.json(period, { status: 201 });
    } catch (error) {
        console.error('Error creating period:', error);
        return NextResponse.json({ error: 'Failed to create period' }, { status: 500 });
    }
}
