import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { tenantId } = await requireTenantContext({ moduleId: 'accounting', action: 'create' });

        // Check if period exists
        const period = await prisma.accountingPeriod.findFirst({
            where: {
                id: resolvedParams.id,
                tenantId
            }
        });

        if (!period) {
            return NextResponse.json({ error: 'Period not found' }, { status: 404 });
        }

        if (period.status === 'CLOSED') {
            return NextResponse.json({ error: 'Period is already closed' }, { status: 400 });
        }

        // Validate that there are no unposted journal entries in this period
        const unpostedEntries = await prisma.journalEntry.count({
            where: {
                periodId: resolvedParams.id,
                status: { not: 'POSTED' }
            }
        });

        if (unpostedEntries > 0) {
            return NextResponse.json({
                error: `Cannot close period. There are ${unpostedEntries} unposted journal entries.`
            }, { status: 400 });
        }

        // Close the period
        const updatedPeriod = await prisma.accountingPeriod.update({
            where: { id: resolvedParams.id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                // closedBy would normally be the current user's ID
            }
        });

        return NextResponse.json(updatedPeriod);
    } catch (error) {
        console.error('Error closing period:', error);
        return NextResponse.json({ error: 'Failed to close period' }, { status: 500 });
    }
}
