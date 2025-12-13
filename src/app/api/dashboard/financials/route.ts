
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

import { AVAILABLE_MODULES } from '@/lib/modules';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId;

    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';

    const now = new Date();
    let startDate, endDate;

    if (period === 'year') {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
    } else {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    try {
        // 1. Fetch Invoice Lines (Revenue & COGS)
        // We fetch lines to get the Product Category
        const invoiceLines = await prisma.invoiceLine.findMany({
            where: {
                invoice: {
                    tenantId,
                    issueDate: { gte: startDate, lte: endDate },
                    // status: { not: 'CANCELLED' } 
                }
            },
            include: {
                product: true
            }
        });

        // 2. Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where: {
                tenantId,
                expenseDate: { gte: startDate, lte: endDate },
                status: 'APPROVED'
            }
        });

        // 3. AGGREGATION
        // Map: CategoryName -> { revenue, cogs, opex }
        const segmentMap = new Map<string, { revenue: number; cogs: number; opex: number }>();

        // Initialize Key Business Modules with 0 values to ensure they appear in the card
        // These are the "Core" business units we want to track explicitly
        const coreModules = ['Hotel', 'Restaurant', 'Real Estate'];
        coreModules.forEach(mod => {
            segmentMap.set(mod, { revenue: 0, cogs: 0, opex: 0 });
        });

        // Process Revenue & COGS
        invoiceLines.forEach(line => {
            // Assuming 'category' is a string field on Product. 
            // If product or category is missing, group under 'Other'
            const categoryName = line.product?.category || 'Other';

            const current = segmentMap.get(categoryName) || { revenue: 0, cogs: 0, opex: 0 };

            const lineRevenue = line.quantity * line.unitPrice;
            const lineCOGS = line.product ? (line.quantity * (line.product.costPrice || 0)) : 0;

            segmentMap.set(categoryName, {
                revenue: current.revenue + lineRevenue,
                cogs: current.cogs + lineCOGS,
                opex: current.opex
            });
        });

        // Process Expenses (Opex)
        expenses.forEach(exp => {
            // Assuming 'category' is a string field on Expense
            const categoryName = exp.category || 'Other';

            const current = segmentMap.get(categoryName) || { revenue: 0, cogs: 0, opex: 0 };

            segmentMap.set(categoryName, {
                revenue: current.revenue,
                cogs: current.cogs,
                opex: current.opex + exp.amount
            });
        });

        // 4. Transform to Array
        const segments = Array.from(segmentMap.entries()).map(([name, data]) => {
            const totalCost = data.cogs + data.opex;
            const grossProfit = data.revenue - totalCost;
            const margin = data.revenue > 0 ? (grossProfit / data.revenue) * 100 : 0;

            return {
                module: name,
                revenue: data.revenue,
                cogs: data.cogs,
                opex: data.opex,
                grossProfit,
                margin
            };
        });

        // Sort by Revenue desc
        segments.sort((a, b) => b.revenue - a.revenue);

        // Calculate Grand Totals
        const grandTotalRevenue = segments.reduce((acc, s) => acc + s.revenue, 0);
        const grandTotalCOGS = segments.reduce((acc, s) => acc + s.cogs, 0);
        const grandTotalOpex = segments.reduce((acc, s) => acc + s.opex, 0);
        const grandTotalProfit = grandTotalRevenue - (grandTotalCOGS + grandTotalOpex);
        const grandTotalMargin = grandTotalRevenue > 0 ? (grandTotalProfit / grandTotalRevenue) * 100 : 0;

        return NextResponse.json({
            period,
            overview: {
                revenue: grandTotalRevenue,
                cogs: grandTotalCOGS,
                opex: grandTotalOpex,
                profit: grandTotalProfit,
                margin: grandTotalMargin
            },
            segments
        });

    } catch (error) {
        console.error('Financial API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
