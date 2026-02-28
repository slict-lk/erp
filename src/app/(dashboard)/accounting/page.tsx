"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Receipt,
  CreditCard,
  RefreshCw,
  Plus,
  ArrowRight,
  BookOpen,
  Landmark,
  FileText,
  ArrowRightLeft,
  BarChart3,
  Clock,
  Settings
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

// --- Types ---
interface Invoice {
  id: string;
  number: string;
  type: string;
  status: string;
  total: number;
  amountDue: number;
  currencyCode?: string;
  issueDate: string;
  dueDate: string;
  customer?: { name: string };
  vendor?: { name: string };
}

interface Payment {
  id: string;
  amount: number;
  status?: string;
  method: string;
  currencyCode?: string;
  paymentDate: string;
  reference?: string;
  invoice?: {
    number: string;
    customer?: { name: string };
    vendor?: { name: string };
  };
}

// --- Components ---
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300/30",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300/30",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300/30",
    DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-300/30",
    CLEARED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300/30",
    RECONCILED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300/30",
    CREDIT_NOTE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300/30",
  };

  return (
    <Badge variant="outline" className={`${styles[status] || styles.DRAFT} text-[10px] font-semibold tracking-wider uppercase`}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

function StatCard({ title, value, subtitle, icon: Icon, variant }: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  variant: 'green' | 'blue' | 'orange' | 'purple';
}) {
  const colors = {
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-2 sm:p-3 flex-shrink-0 ${colors[variant]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon: Icon, label, color }: {
  href: string;
  icon: any;
  label: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 text-center min-h-[100px] sm:min-h-[120px]">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center mb-2`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AccountingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeDate = (dateString: string) => {
    if (!dateString) return null;
    const d = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  };

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const [invRes, payRes] = await Promise.all([
        fetch('/api/accounting/invoices?limit=10'),
        fetch('/api/accounting/payments?limit=10')
      ]);

      if (invRes.ok) setInvoices(await invRes.json());
      if (payRes.ok) setPayments(await payRes.json());
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived metrics grouped by currency
  const totalReceivables = invoices.filter(i => i.type === 'SALES' && ['OPEN', 'OVERDUE'].includes(i.status)).reduce((acc, i) => {
    const c = i.currencyCode || 'LKR';
    acc[c] = (acc[c] || 0) + Number(i.amountDue);
    return acc;
  }, {} as Record<string, number>);

  const totalPayables = invoices.filter(i => i.type === 'PURCHASE' && ['OPEN', 'OVERDUE'].includes(i.status)).reduce((acc, i) => {
    const c = i.currencyCode || 'LKR';
    acc[c] = (acc[c] || 0) + Number(i.amountDue);
    return acc;
  }, {} as Record<string, number>);

  const totalPayments = payments.reduce((acc, p) => {
    const c = p.currencyCode || 'LKR';
    acc[c] = (acc[c] || 0) + Number(p.amount);
    return acc;
  }, {} as Record<string, number>);

  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;

  const formatGroupedValues = (group: Record<string, number>) => {
    const entries = Object.entries(group);
    if (entries.length === 0) return formatCurrency(0, 'LKR');
    return entries.map(([c, v]) => formatCurrency(v, c)).join(' + ');
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3 tracking-tight">
            <span className="p-2 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20 text-white">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            Accounting
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Financial overview, ledger management, and real-time reporting.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchData} disabled={refreshing} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/accounting/journal-entries">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Receivables"
          value={formatGroupedValues(totalReceivables)}
          subtitle={`${invoices.filter(i => i.type === 'SALES' && i.status === 'OPEN').length} open invoices`}
          icon={TrendingUp}
          variant="green"
        />
        <StatCard
          title="Total Payables"
          value={formatGroupedValues(totalPayables)}
          subtitle={`${invoices.filter(i => i.type === 'PURCHASE' && i.status === 'OPEN').length} open bills`}
          icon={TrendingDown}
          variant="orange"
        />
        <StatCard
          title="Payments Received"
          value={formatGroupedValues(totalPayments)}
          subtitle={`${payments.length} transactions`}
          icon={Wallet}
          variant="blue"
        />
        <StatCard
          title="Overdue Items"
          value={overdueCount.toString()}
          subtitle="Need attention"
          icon={Clock}
          variant="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <QuickAction href="/accounting/invoices" icon={Receipt} label="Invoices" color="bg-blue-500" />
        <QuickAction href="/accounting/payments" icon={CreditCard} label="Payments" color="bg-green-500" />
        <QuickAction href="/accounting/chart-of-accounts" icon={Landmark} label="Chart of Accounts" color="bg-indigo-500" />
        <QuickAction href="/accounting/journal-entries" icon={BookOpen} label="Journal Entries" color="bg-purple-500" />
        <QuickAction href="/accounting/bank-reconciliation" icon={ArrowRightLeft} label="Bank Rec" color="bg-teal-500" />
        <QuickAction href="/accounting/reports" icon={BarChart3} label="Reports" color="bg-orange-500" />
        <QuickAction href="/accounting/settings" icon={Settings} label="Settings" color="bg-gray-500" />
      </div>

      {/* Main Content: Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest billing activity</CardDescription>
            </div>
            <Link href="/accounting/invoices">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">Loading...</div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mb-2 opacity-20" />
                <p>No recent invoices</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{inv.number}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {inv.type === 'SALES' ? inv.customer?.name : inv.vendor?.name} • {safeDate(inv.issueDate) ? format(safeDate(inv.issueDate)!, 'MMM dd') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(inv.total, inv.currencyCode || 'LKR')}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment activity</CardDescription>
            </div>
            <Link href="/accounting/payments">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mb-2 opacity-20" />
                <p>No recent payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{pay.reference || pay.invoice?.number || 'Payment'}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {pay.method} • {format(new Date(pay.paymentDate), 'MMM dd')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(pay.amount, pay.currencyCode || 'LKR')}</p>
                      {pay.status && <StatusBadge status={pay.status} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
