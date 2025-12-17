import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const tenant = await getOrCreateDefaultTenant();
        const expense = await prisma.expense.findUnique({
            where: {
                id: params.id,
                tenantId: tenant.id,
            },
            include: {
                employee: true,
            },
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const tenant = await getOrCreateDefaultTenant();
        const body = await request.json();

        const expense = await prisma.expense.update({
            where: {
                id: params.id,
                tenantId: tenant.id,
            },
            data: {
                description: body.description,
                amount: body.amount,
                category: body.category,
                status: body.status,
                employeeId: body.employeeId === 'none' ? null : body.employeeId,
                expenseDate: new Date(body.expenseDate),
                receipt: body.receipt,
                notes: body.notes,
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const tenant = await getOrCreateDefaultTenant();

        await prisma.expense.delete({
            where: {
                id: params.id,
                tenantId: tenant.id,
            },
        });

        return NextResponse.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
