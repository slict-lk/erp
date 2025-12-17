import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { startOfDay, endOfDay, parseISO, differenceInDays } from 'date-fns';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ reportId: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const reportId = params.reportId;

    if (!startDateStr || !endDateStr) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const startDate = startOfDay(parseISO(startDateStr));
    const endDate = endOfDay(parseISO(endDateStr));

    let tenantId = session?.user?.tenantId;
    if (!tenantId) {
        const tenant = await getOrCreateDefaultTenant();
        tenantId = tenant.id;
    }

    try {
        let data: any[] = [];

        switch (reportId) {
            // SALES
            case 'sales-analysis':
                const sales = await prisma.salesOrder.findMany({
                    where: {
                        tenantId,
                        createdAt: { gte: startDate, lte: endDate },
                    },
                    include: { customer: true }
                });

                data = sales.map(order => ({
                    'Order #': order.number,
                    'Date': order.createdAt.toISOString().split('T')[0],
                    'Customer': order.customer?.name || 'Unknown',
                    'Status': order.status,
                    'Total': order.grandTotal,
                    'Tax': order.tax,
                    'Discount': order.discount
                }));
                break;

            case 'customer-analysis':
                const salesForCustomer = await prisma.salesOrder.findMany({
                    where: {
                        tenantId,
                        createdAt: { gte: startDate, lte: endDate }
                    },
                    include: { customer: true }
                });

                const customerStats: Record<string, { name: string, count: number, total: number }> = {};
                salesForCustomer.forEach(order => {
                    const cid = order.customerId;
                    if (!customerStats[cid]) {
                        customerStats[cid] = { name: order.customer?.name || 'Unknown', count: 0, total: 0 };
                    }
                    customerStats[cid].count += 1;
                    customerStats[cid].total += order.grandTotal;
                });

                data = Object.values(customerStats).map(c => ({
                    'Customer': c.name,
                    'Orders Count': c.count,
                    'Total Spend': c.total.toFixed(2)
                }));
                break;

            case 'product-sales':
                const invoiceLines = await prisma.invoiceLine.findMany({
                    where: {
                        invoice: {
                            tenantId,
                            issueDate: { gte: startDate, lte: endDate }
                        }
                    },
                    include: { product: true }
                });

                const productStats: Record<string, { name: string, qty: number, total: number }> = {};
                invoiceLines.forEach(line => {
                    const pid = line.productId || 'service';
                    if (!productStats[pid]) {
                        productStats[pid] = { name: line.product?.name || line.description, qty: 0, total: 0 };
                    }
                    productStats[pid].qty += line.quantity;
                    productStats[pid].total += line.total;
                });

                data = Object.values(productStats).map(p => ({
                    'Product': p.name,
                    'Quantity Sold': p.qty,
                    'Total Revenue': p.total.toFixed(2)
                }));
                break;

            // INVENTORY
            case 'stock-valuation':
                const products = await prisma.product.findMany({
                    where: { tenantId },
                    select: { name: true, sku: true, stockQty: true, costPrice: true, salePrice: true }
                });

                data = products.map(p => ({
                    'Product': p.name,
                    'SKU': p.sku,
                    'Quantity': p.stockQty,
                    'Cost Price': p.costPrice,
                    'Total Value': (p.stockQty * p.costPrice).toFixed(2),
                    'Potential Revenue': (p.stockQty * p.salePrice).toFixed(2)
                }));
                break;

            case 'low-stock':
                const lowStockProducts = await prisma.product.findMany({
                    where: { tenantId }
                });

                data = lowStockProducts
                    .filter(p => p.stockQty <= p.minStockQty)
                    .map(p => ({
                        'Product': p.name,
                        'SKU': p.sku,
                        'Current Stock': p.stockQty,
                        'Min Stock': p.minStockQty,
                        'Status': 'Low Stock'
                    }));
                break;

            case 'stock-movement':
                const movements = await prisma.stockMovement.findMany({
                    where: {
                        tenantId,
                        movementDate: { gte: startDate, lte: endDate }
                    },
                    include: { product: true, warehouse: true }
                });

                data = movements.map(m => ({
                    'Date': m.movementDate.toISOString().split('T')[0],
                    'Product': m.product.name,
                    'SKU': m.product.sku,
                    'Warehouse': m.warehouse.name,
                    'Type': m.type,
                    'Quantity': m.quantity,
                    'Reference': m.reference || '-'
                }));
                break;

            // HR
            case 'attendance-summary':
                const attendance = await prisma.attendance.findMany({
                    where: {
                        tenantId,
                        date: { gte: startDate, lte: endDate }
                    },
                    include: { employee: true }
                });

                data = attendance.map(a => ({
                    'Employee': `${a.employee.firstName} ${a.employee.lastName}`,
                    'Date': a.date.toISOString().split('T')[0],
                    'Status': a.status,
                    'Check In': a.checkIn ? a.checkIn.toISOString().split('T')[1].substring(0, 5) : '-',
                    'Check Out': a.checkOut ? a.checkOut.toISOString().split('T')[1].substring(0, 5) : '-'
                }));
                break;

            case 'leave-balance':
                const employeesForLeave = await prisma.employee.findMany({
                    where: { tenantId, isActive: true },
                    include: { leaveRequests: { where: { status: 'APPROVED' } } }
                });

                data = employeesForLeave.map(e => {
                    const usedLeave = e.leaveRequests.reduce((sum, r) => sum + r.days, 0);
                    return {
                        'Employee': `${e.firstName} ${e.lastName}`,
                        'Employee ID': e.employeeId,
                        'Department': e.departmentId || '-',
                        'Leave Used': usedLeave,
                        'Leave Balance': 20 - usedLeave // Assuming 20 days standard
                    };
                });
                break;

            case 'payroll-summary':
                const employeesForPayroll = await prisma.employee.findMany({
                    where: { tenantId, isActive: true }
                });

                data = employeesForPayroll.map(e => ({
                    'Employee': `${e.firstName} ${e.lastName}`,
                    'Employee ID': e.employeeId,
                    'Position': e.position,
                    'Type': e.type,
                    'Monthly Salary': e.salary || 0,
                    'Annual Salary': (e.salary || 0) * 12
                }));
                break;

            case 'employee-turnover':
                const allEmployees = await prisma.employee.findMany({
                    where: { tenantId }
                });

                data = allEmployees.map(e => ({
                    'Employee': `${e.firstName} ${e.lastName}`,
                    'Hire Date': e.hireDate.toISOString().split('T')[0],
                    'Status': e.isActive ? 'Active' : 'Inactive',
                    'Tenure (Days)': differenceInDays(new Date(), e.hireDate)
                }));
                break;

            // FINANCIAL
            case 'profit-loss':
                const invoices = await prisma.invoice.findMany({
                    where: {
                        tenantId,
                        issueDate: { gte: startDate, lte: endDate },
                    }
                });

                const expenses = await prisma.expense.findMany({
                    where: {
                        tenantId,
                        expenseDate: { gte: startDate, lte: endDate },
                        status: 'APPROVED'
                    }
                });

                const totalIncome = invoices.reduce((sum, inv) => sum + inv.total, 0);
                const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

                const incomeRows = invoices.map(i => ({
                    'Date': i.issueDate.toISOString().split('T')[0],
                    'Type': 'Income',
                    'Description': `Invoice #${i.number}`,
                    'Amount': i.total,
                    'Category': 'Sales'
                }));

                const expenseRows = expenses.map(e => ({
                    'Date': e.expenseDate.toISOString().split('T')[0],
                    'Type': 'Expense',
                    'Description': e.description,
                    'Amount': -e.amount,
                    'Category': e.category
                }));

                data = [...incomeRows, ...expenseRows].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
                data.push({});
                data.push({ 'Date': 'TOTAL', 'Type': '', 'Description': 'NET PROFIT', 'Amount': totalIncome - totalExpenses, 'Category': '' });
                break;

            case 'balance-sheet':
                const accounts = await prisma.account.findMany({
                    where: { tenantId }
                });

                data = accounts.map(acc => ({
                    'Code': acc.code,
                    'Account Name': acc.name,
                    'Type': acc.type,
                    'Balance': acc.balance.toFixed(2)
                }));

                const totalAssets = accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0);
                const totalLiabilities = accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0);
                const totalEquity = accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0);

                data.push({});
                data.push({ 'Code': 'SUMMARY', 'Account Name': 'Total Assets', 'Type': 'ASSET', 'Balance': totalAssets.toFixed(2) });
                data.push({ 'Code': 'SUMMARY', 'Account Name': 'Total Liabilities', 'Type': 'LIABILITY', 'Balance': totalLiabilities.toFixed(2) });
                data.push({ 'Code': 'SUMMARY', 'Account Name': 'Total Equity', 'Type': 'EQUITY', 'Balance': totalEquity.toFixed(2) });
                break;

            case 'cash-flow':
                const payments = await prisma.payment.findMany({
                    where: {
                        tenantId,
                        paymentDate: { gte: startDate, lte: endDate }
                    },
                    include: { invoice: true }
                });

                const cashExpenses = await prisma.expense.findMany({
                    where: {
                        tenantId,
                        expenseDate: { gte: startDate, lte: endDate },
                        status: 'APPROVED'
                    }
                });

                const paymentRows = payments.map(p => ({
                    'Date': p.paymentDate.toISOString().split('T')[0],
                    'Type': 'Cash In',
                    'Description': `Payment for Invoice #${p.invoice.number}`,
                    'Amount': p.amount
                }));

                const cashExpenseRows = cashExpenses.map(e => ({
                    'Date': e.expenseDate.toISOString().split('T')[0],
                    'Type': 'Cash Out',
                    'Description': e.description,
                    'Amount': -e.amount
                }));

                data = [...paymentRows, ...cashExpenseRows].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
                const netCashFlow = payments.reduce((sum, p) => sum + p.amount, 0) - cashExpenses.reduce((sum, e) => sum + e.amount, 0);
                data.push({});
                data.push({ 'Date': 'TOTAL', 'Type': 'SUMMARY', 'Description': 'NET CASH FLOW', 'Amount': netCashFlow.toFixed(2) });
                break;

            case 'aged-receivables':
                const openInvoices = await prisma.invoice.findMany({
                    where: {
                        tenantId,
                        status: { in: ['OPEN', 'OVERDUE'] },
                        amountDue: { gt: 0 }
                    },
                    include: { customer: true }
                });

                data = openInvoices.map(inv => {
                    const daysOverdue = differenceInDays(new Date(), inv.dueDate);
                    return {
                        'Invoice #': inv.number,
                        'Customer': inv.customer.name,
                        'Due Date': inv.dueDate.toISOString().split('T')[0],
                        'Amount Due': inv.amountDue.toFixed(2),
                        'Days Overdue': daysOverdue > 0 ? daysOverdue : 0,
                        'Status': inv.status
                    };
                });
                break;

            default:
                data = [];
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
