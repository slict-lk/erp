"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  FileText,
  TrendingUp,
  CreditCard,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  type: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  issueDate: string;
  dueDate: string;
  customer: { name: string } | null;
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference: string | null;
  invoice: {
    invoiceNumber: string;
    customer: { name: string } | null;
  } | null;
}

interface Expense {
  id: string;
  reference: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount ?? 0);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default function AccountingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [invoicesRes, paymentsRes, expensesRes] = await Promise.all([
        fetch('/api/accounting/invoices'),
        fetch('/api/accounting/payments'),
        fetch('/api/accounting/expenses'),
      ]);

      if (!invoicesRes.ok) throw new Error('Failed to load invoices');
      if (!paymentsRes.ok) throw new Error('Failed to load payments');
      if (!expensesRes.ok) throw new Error('Failed to load expenses');

      setInvoices((await invoicesRes.json()) ?? []);
      setPayments((await paymentsRes.json()) ?? []);
      setExpenses((await expensesRes.json()) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === 'SALES' && inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  const outstanding = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'OPEN' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amountDue, 0);
  }, [invoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const profit = totalRevenue - totalExpenses;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounting & Finance</h1>
          <p className="text-gray-600">
            Manage invoicing, payments, expenses, and monitor financial performance.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Paid invoices"
          icon={DollarSign}
          variant="emerald"
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(outstanding)}
          subtitle="Unpaid invoices"
          icon={FileText}
          variant="amber"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(profit)}
          subtitle="Revenue minus expenses"
          icon={TrendingUp}
          variant={profit >= 0 ? 'teal' : 'red'}
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle="Total costs"
          icon={CreditCard}
          variant="rose"
        />
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Track billing and receivables status.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading invoices..." />
              ) : invoices.length === 0 ? (
                <EmptyState message="No invoices created yet." />
              ) : (
                <div className="space-y-3">
                  {invoices.slice(0, 15).map((invoice) => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Track all incoming payments and transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading payments..." />
              ) : payments.length === 0 ? (
                <EmptyState message="No payments recorded." />
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 15).map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Tracking</CardTitle>
              <CardDescription>Monitor operational costs and spending patterns.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading expenses..." />
              ) : expenses.length === 0 ? (
                <EmptyState message="No expenses logged." />
              ) : (
                <div className="space-y-3">
                  {expenses.slice(0, 15).map((expense) => (
                    <ExpenseRow key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: typeof DollarSign;
  variant: 'emerald' | 'amber' | 'teal' | 'rose' | 'red';
}) {
  const accentMap = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    teal: 'bg-teal-100 text-teal-600',
    rose: 'bg-rose-100 text-rose-600',
    red: 'bg-red-100 text-red-600',
  } as const;

  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${accentMap[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-gray-500">
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-sm text-gray-500">
      {message}
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const statusIcons = {
    PAID: <CheckCircle className="h-4 w-4" />,
    OPEN: <Clock className="h-4 w-4" />,
    OVERDUE: <AlertCircle className="h-4 w-4" />,
    DRAFT: <FileText className="h-4 w-4" />,
    CANCELLED: <FileText className="h-4 w-4" />,
  };

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    PAID: 'default',
    OPEN: 'secondary',
    OVERDUE: 'destructive',
    DRAFT: 'outline',
    CANCELLED: 'secondary',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-green-100 p-2">
          <Receipt className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500">
            {invoice.customer?.name ?? 'Unknown'} · Due {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
        <Badge variant={statusVariants[invoice.status] || 'outline'}>
          <div className="flex items-center gap-1">
            {statusIcons[invoice.status as keyof typeof statusIcons]}
            {invoice.status}
          </div>
        </Badge>
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-teal-100 p-2">
          <CheckCircle className="h-4 w-4 text-teal-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{payment.paymentNumber}</p>
          <p className="text-xs text-gray-500">
            {payment.invoice?.customer?.name ?? 'Direct payment'} · {payment.method}
            {payment.reference && ` · Ref: ${payment.reference}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
        <p className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</p>
      </div>
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-rose-100 p-2">
          <CreditCard className="h-4 w-4 text-rose-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{expense.reference}</p>
          <p className="text-xs text-gray-500">
            {expense.category} · {expense.description || 'No description'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-rose-600">-{formatCurrency(expense.amount)}</p>
        <p className="text-xs text-gray-500">{formatDate(expense.date)}</p>
      </div>
    </div>
  );
}
