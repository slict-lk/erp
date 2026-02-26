import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const tenant = await getOrCreateDefaultTenant();

        // Auth Check
        const { requirePermission } = await import('@/lib/auth');
        await requirePermission('accounting', 'view');

        const { searchParams } = new URL(request.url);
        const bankAccountId = searchParams.get('bankAccountId');

        if (!bankAccountId) {
            return NextResponse.json({ error: 'Bank account ID is required' }, { status: 400 });
        }

        // Fetch the un-reconciled statements
        const statements = await prisma.bankStatement.findMany({
            where: {
                tenantId: tenant.id,
                bankAccountId: bankAccountId,
            },
            include: {
                lines: {
                    where: {
                        status: 'UNRECONCILED'
                    }
                }
            },
            orderBy: { periodEnd: 'desc' }
        });

        return NextResponse.json(statements);

    } catch (error) {
        console.error(`Error fetching bank statements:`, error);
        return NextResponse.json({ error: `Failed to fetch bank statements` }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    // Creating a new bank statement (typically parsed from CSV/MT940 in real life)
    try {
        const tenant = await getOrCreateDefaultTenant();
        const { requirePermission } = await import('@/lib/auth');
        await requirePermission('accounting', 'create');

        const body = await request.json();

        const statement = await prisma.$transaction(async (tx) => {
            const stmt = await tx.bankStatement.create({
                data: {
                    tenantId: tenant.id,
                    bankAccountId: body.bankAccountId,
                    periodStart: new Date(body.periodStart),
                    periodEnd: new Date(body.periodEnd),
                    openingBalance: body.openingBalance,
                    closingBalance: body.closingBalance,
                    lines: {
                        create: body.lines.map((line: any) => ({
                            date: new Date(line.date),
                            description: line.description,
                            amount: line.amount,
                            balance: line.balance,
                            reference: line.reference,
                            status: 'UNRECONCILED'
                        }))
                    }
                },
                include: { lines: true }
            });
            return stmt;
        });

        return NextResponse.json(statement, { status: 201 });
    } catch (error) {
        console.error('Error creating bank statement:', error);
        return NextResponse.json({ error: 'Failed to create statement' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    // Matching a statement line to a payment
    try {
        const tenant = await getOrCreateDefaultTenant();
        const { requirePermission } = await import('@/lib/auth');
        await requirePermission('accounting', 'edit');

        const body = await request.json();
        const { statementLineId, paymentId } = body;

        const result = await prisma.$transaction(async (tx) => {
            const line = await tx.bankStatementLine.update({
                where: { id: statementLineId },
                data: {
                    status: 'RECONCILED',
                    paymentId: paymentId
                }
            });

            await tx.payment.update({
                where: { id: paymentId },
                data: { status: 'RECONCILED' }
            });

            return line;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error reconciling line:', error);
        return NextResponse.json({ error: 'Failed to reconcile bank statement' }, { status: 500 });
    }
}
