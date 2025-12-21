import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tenant = await getOrCreateDefaultTenant();

        const bed = await prisma.hospitalBed.findFirst({
            where: { id, tenantId: tenant.id },
            include: {
                ward: true,
                admissions: {
                    where: { status: 'ADMITTED' },
                    include: { patient: true },
                    take: 1,
                },
            },
        });

        if (!bed) {
            return NextResponse.json(
                { error: 'Bed not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(bed);
    } catch (error) {
        console.error('Error fetching bed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bed' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const tenant = await getOrCreateDefaultTenant();
        const data = await request.json();

        const bed = await prisma.hospitalBed.update({
            where: { id },
            data: {
                bedNumber: data.bedNumber,
                bedType: data.bedType,
                dailyRate: data.dailyRate,
                status: data.status,
            },
        });

        return NextResponse.json(bed);
    } catch (error) {
        console.error('Error updating bed:', error);
        return NextResponse.json(
            { error: 'Failed to update bed' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if bed has active admissions
        const activeAdmissions = await prisma.admission.count({
            where: { bedId: id, status: 'ADMITTED' },
        });

        if (activeAdmissions > 0) {
            return NextResponse.json(
                { error: 'Cannot delete bed with active admissions' },
                { status: 400 }
            );
        }

        await prisma.hospitalBed.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting bed:', error);
        return NextResponse.json(
            { error: 'Failed to delete bed' },
            { status: 500 }
        );
    }
}
