
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  ShoppingBag,
  Package,
  Factory,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CalendarClock,
  BarChart3,
  Building2,
  Sparkles,
  Globe,
  ArrowRight,
  MoreHorizontal,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// --- Types ---

type DashboardResponse = {
  stats?: {
    totalRevenue?: number;
    revenueChange?: number;
    customerCount?: number;
    customerChange?: number;
    orderCount?: number;
    orderChange?: number;
    productCount?: number;
    productChange?: number;
  };
  recentOrders?: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    createdAt?: string;
  }>;
  manufacturing?: {
    inProgress?: number;
    scheduled?: number;
    pending?: number;
  };
};

// --- Mock Data for Charts ---

const REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
];

const SALES_BY_CATEGORY = [
  { name: 'Electronics', value: 4000 },
  { name: 'Clothing', value: 3000 },
  { name: 'Home', value: 2000 },
  { name: 'Sports', value: 2780 },
];

// --- Constants ---

const QUICK_LINKS = [
  { href: '/sales', title: 'Sales & CRM', icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
  { href: '/accounting', title: 'Accounting', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  { href: '/inventory', title: 'Inventory', icon: Package, color: 'text-violet-600 bg-violet-50' },
  { href: '/hr', title: 'HR & People', icon: Users, color: 'text-orange-600 bg-orange-50' },
  { href: '/manufacturing', title: 'Manufacturing', icon: Factory, color: 'text-amber-600 bg-amber-50' },
  { href: '/projects', title: 'Projects', icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
];

// --- Helper Functions ---

const formatCurrency = (value?: number) =>
  `$${Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (value?: number) => Number(value ?? 0).toLocaleString('en-US');

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// --- Components ---

export default function DashboardPage() {
  const { data: session } = useSession();
  const [response, setResponse] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const tenantId = session?.user?.tenantId;

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    // Simulate loading for smoother transition if API is fast
    const timer = setTimeout(() => {
      fetch(`/api/dashboard/stats?tenantId=${tenantId}`)
        .then((res) => res.json())
        .then((json) => {
          setResponse(json);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch dashboard data:', err);
          setLoading(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [tenantId]);

  const stats = response?.stats ?? {};
  const recentOrders = response?.recentOrders ?? [];
  const manufacturing = response?.manufacturing ?? {};

  const metrics = useMemo(
    () => [
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.totalRevenue),
        change: stats.revenueChange,
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
      {
        title: 'Active Customers',
        value: formatNumber(stats.customerCount),
        change: stats.customerChange,
        icon: Users,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        title: 'Total Orders',
        value: formatNumber(stats.orderCount),
        change: stats.orderChange,
        icon: ShoppingBag,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
      },
      {
        title: 'Products in Stock',
        value: formatNumber(stats.productCount),
        change: stats.productChange,
        icon: Package,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>No Tenant Connected</CardTitle>
            <CardDescription>
              Please connect to an organization to view your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Link href="/settings/company">
              <Button>Connect Tenant</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] ?? 'User';

  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-slate-500">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Last 30 Days
          </Button>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-2.5 ${metric.bg} ${metric.color}`}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                  {metric.change !== undefined && (
                    <Badge
                      variant="secondary"
                      className={`${metric.change >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} border-transparent`}
                    >
                      {metric.change >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                      {Math.abs(metric.change).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-500">{metric.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{metric.value}</h3>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-7">
        {/* Charts Section */}
        <Card className="col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue performance for the current year</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders / Activity */}
        <Card className="col-span-3 border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest transactions from your store</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="rounded-full bg-slate-100 p-3">
                    <ShoppingBag className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">No recent orders found</p>
                </div>
              ) : (
                recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{order.customer}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(order.createdAt || '').toLocaleDateString()} • #{order.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{formatCurrency(order.amount)}</p>
                      <Badge variant="outline" className="mt-1 border-slate-200 text-xs font-normal text-slate-600">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="group cursor-pointer border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className={`rounded-xl p-3 ${link.color} transition-transform group-hover:scale-110`}>
                    <link.icon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-slate-700 group-hover:text-blue-600">
                    {link.title}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Production & Tasks Row */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Production Status</CardTitle>
            <CardDescription>Real-time manufacturing overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'In Progress', value: manufacturing.inProgress || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Scheduled', value: manufacturing.scheduled || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Pending', value: manufacturing.pending || 0, color: 'text-slate-600', bg: 'bg-slate-50' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
                  <span className="text-xs font-medium text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Operational status and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">All Systems Operational</p>
                    <p className="text-xs text-emerald-700">Database, API, and Workers running normally</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">99.9% Uptime</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Last Backup</p>
                    <p className="text-xs text-slate-500">2 hours ago • 1.2GB</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs">View Log</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
