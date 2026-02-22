
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });

        // 1. Lead Count (Qualified)
        const leadCount = await prisma.lead.count({
            where: {
                tenantId,
                status: { not: 'LOST' } // Assuming active leads
            }
        });

        // 2. Active Opportunities & Pipeline Value
        const activeOpportunities = await prisma.opportunity.findMany({
            where: {
                tenantId,
                stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST', 'WON', 'LOST'] }
            },
            select: {
                amount: true
            }
        });

        const activeOppCount = activeOpportunities.length;
        const pipelineValue = activeOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0);

        // 3. Win Rate
        const wonCount = await prisma.opportunity.count({
            where: {
                tenantId,
                stage: { in: ['CLOSED_WON', 'WON'] }
            }
        });

        const lostCount = await prisma.opportunity.count({
            where: {
                tenantId,
                stage: { in: ['CLOSED_LOST', 'LOST'] }
            }
        });

        const totalClosed = wonCount + lostCount;
        const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

        // 4. Quote to Order Ratio
        const quoteCount = await prisma.quotation.count({
            where: { tenantId }
        });

        const orderCount = await prisma.salesOrder.count({
            where: { tenantId }
        });

        const quoteToOrder = quoteCount > 0 ? Math.round((orderCount / quoteCount) * 100) : 0;

        return NextResponse.json({
            leadCount,
            activeOpportunities: activeOppCount,
            pipelineValue,
            winRate,
            quoteToOrder
        });

    } catch (error) {
        console.error('Error fetching sales metrics:', error);
        return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
}
