import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Process discharge
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: admissionId } = await params;
        const tenant = await getOrCreateDefaultTenant();
        const data = await request.json();

        // Get admission with all charges
        const admission = await prisma.admission.findFirst({
            where: { id: admissionId, tenantId: tenant.id },
            include: {
                bed: true,
                charges: true,
                patient: true,
            },
        });

        if (!admission) {
            return NextResponse.json(
                { error: 'Admission not found' },
                { status: 404 }
            );
        }

        if (admission.status !== 'ADMITTED') {
            return NextResponse.json(
                { error: 'Patient is not currently admitted' },
                { status: 400 }
            );
        }

        // Calculate room charges if not already added
        const admissionDate = new Date(admission.admissionDate);
        const dischargeDate = new Date();
        const days = Math.max(1, Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
        const roomRate = admission.bed.dailyRate;

        // Check if room charge already exists
        const hasRoomCharge = admission.charges.some(c => c.chargeType === 'ROOM');

        if (!hasRoomCharge && roomRate > 0) {
            // Add room charge
            await prisma.admissionCharge.create({
                data: {
                    admissionId,
                    chargeType: 'ROOM',
                    description: `Room charges (${days} days @ Rs.${roomRate}/day)`,
                    quantity: days,
                    unitPrice: roomRate,
                    totalAmount: days * roomRate,
                    tenantId: tenant.id,
                },
            });
        }

        // Calculate final total
        const finalCharges = await prisma.admissionCharge.findMany({
            where: { admissionId },
        });

        const totalCharges = finalCharges.reduce((sum, c) => sum + c.totalAmount, 0);
        const balanceDue = totalCharges - admission.depositAmount;

        // Update admission with discharge info
        const updatedAdmission = await prisma.admission.update({
            where: { id: admissionId },
            data: {
                status: 'DISCHARGED',
                dischargeDate: dischargeDate,
                dischargeNotes: data.dischargeNotes,
                totalCharges,
            },
        });

        // Release the bed
        await prisma.hospitalBed.update({
            where: { id: admission.bedId },
            data: { status: 'AVAILABLE' },
        });

        return NextResponse.json({
            admission: updatedAdmission,
            summary: {
                admissionDate: admission.admissionDate,
                dischargeDate: dischargeDate,
                daysStayed: days,
                totalCharges,
                depositPaid: admission.depositAmount,
                balanceDue,
                charges: finalCharges,
            },
        });
    } catch (error) {
        console.error('Error processing discharge:', error);
        return NextResponse.json(
            { error: 'Failed to process discharge' },
            { status: 500 }
        );
    }
}
