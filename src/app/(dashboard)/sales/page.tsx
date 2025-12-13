"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  TrendingUp,
  ShoppingCart,
  Filter,
  RefreshCw,
  CalendarCheck,
  Target,
  Phone,
  Mail,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  priority: string;
  expectedRevenue: number;
  probability: number;
  createdAt: string;
  customer?: { name: string } | null;
}

interface Opportunity {
  id: string;
  name: string;
  amount: number;
  probability: number;
  stage: string;
  expectedCloseDate: string | null;
  customer?: { name: string } | null;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer?: { name: string } | null;
}

interface Quotation {
  id: string;
  quoteNumber: string;
  status: string;
  total: number;
  createdAt: string;
  validUntil: string;
  customer?: { name: string } | null;
}

interface SalesStats {
  leadCount: number;
  activeOpportunities: number;
  pipelineValue: number;
  winRate: number;
  quoteToOrder: number;
}



function formatDate(date?: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date)
  );
}

export default function SalesPage() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    leadStatus: 'ALL',
    leadPriority: 'ALL',
    pipelineStage: 'ALL',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsRes, leadsRes, oppRes, ordersRes, quotesRes] = await Promise.all([
        fetch('/api/sales/metrics'),
        fetch('/api/sales/leads'),
        fetch('/api/sales/opportunities'),
        fetch('/api/sales/orders?status=CONFIRMED'),
        fetch('/api/sales/quotations'),
      ]);

      if (!statsRes.ok) throw new Error('Failed to load sales metrics');
      if (!leadsRes.ok) throw new Error('Failed to load leads');
      if (!oppRes.ok) throw new Error('Failed to load opportunities');
      if (!ordersRes.ok) throw new Error('Failed to load orders');
      if (!quotesRes.ok) throw new Error('Failed to load quotations');

      const statsData = await statsRes.json();
      setStats(statsData);

      const leadsData = await leadsRes.json();
      setLeads(Array.isArray(leadsData) ? leadsData : []);

      const oppData = await oppRes.json();
      setOpportunities(Array.isArray(oppData) ? oppData : []);

      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      const quotesData = await quotesRes.json();
      setQuotations(Array.isArray(quotesData) ? quotesData : []);
    } catch (error) {
      console.error(error);
      // Ensure arrays on error
      setLeads([]);
      setOpportunities([]);
      setOrders([]);
      setQuotations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    return leads
      .filter((lead) =>
        searchTerm
          ? lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .filter((lead) => (filters.leadStatus === 'ALL' ? true : lead.status === filters.leadStatus))
      .filter((lead) => (filters.leadPriority === 'ALL' ? true : lead.priority === filters.leadPriority));
  }, [leads, searchTerm, filters.leadStatus, filters.leadPriority]);

  const filteredOpportunities = useMemo(() => {
    if (!Array.isArray(opportunities)) return [];
    return opportunities.filter((opportunity) =>
      filters.pipelineStage === 'ALL' ? true : opportunity.stage === filters.pipelineStage
    );
  }, [opportunities, filters.pipelineStage]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales & CRM</h1>
          <p className="text-gray-600">
            Manage leads, track opportunities, and monitor performance across the entire pipeline.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Input
              placeholder="Search leads or opportunities..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Filter className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Button variant="outline" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(stats?.pipelineValue ?? 0)}
          subtitle="Total potential revenue"
          icon={DollarSign}
          variant="teal"
        />
        <StatCard
          title="Active Opportunities"
          value={String(stats?.activeOpportunities ?? 0)}
          subtitle="Open deals in pipeline"
          icon={TrendingUp}
          variant="sky"
        />
        <StatCard
          title="Qualified Leads"
          value={String(stats?.leadCount ?? 0)}
          subtitle="Ready for follow-up"
          icon={Users}
          variant="indigo"
        />
        <StatCard
          title="Win Rate"
          value={`${stats?.winRate ?? 0}%`}
          subtitle="Closed vs lost deals"
          icon={Target}
          variant="amber"
        />
        <StatCard
          title="Quote → Order"
          value={`${stats?.quoteToOrder ?? 0}%`}
          subtitle="Conversion efficiency"
          icon={ShoppingCart}
          variant="purple"
        />
      </div>

      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="orders">Orders & Quotes</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Lead Qualification</CardTitle>
                <CardDescription>Track new leads and prioritize follow-ups.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select
                  value={filters.leadStatus}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, leadStatus: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="QUALIFIED">Qualified</SelectItem>
                    <SelectItem value="PROPOSITION">Proposal Sent</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.leadPriority}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, leadPriority: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading leads..." />
              ) : filteredLeads.length === 0 ? (
                <EmptyState message="No leads found for the selected filters." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Lead</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-left">Priority</th>
                        <th className="px-4 py-3 text-left">Expected Revenue</th>
                        <th className="px-4 py-3 text-left">Probability</th>
                        <th className="px-4 py-3 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{lead.name}</span>
                              <span className="text-xs text-gray-500">
                                {lead.customer?.name ? `Linked to ${lead.customer.name}` : 'Unassigned'}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400" /> {lead.email || '—'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400" /> {lead.phone || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge variant={priorityVariant(lead.priority)}>{lead.priority}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium">
                            {formatCurrency(lead.expectedRevenue ?? 0)}
                          </td>
                          <td className="px-4 py-3">
                            <ProbabilityBar value={lead.probability ?? 0} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                            {formatDate(lead.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Pipeline Stages</CardTitle>
                <CardDescription>Monitor deal velocity and conversion rates.</CardDescription>
              </div>
              <Select
                value={filters.pipelineStage}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, pipelineStage: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Stages</SelectItem>
                  <SelectItem value="prospecting">Prospecting</SelectItem>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <LoadingState message="Loading pipeline..." />
              ) : filteredOpportunities.length === 0 ? (
                <EmptyState message="No opportunities in the selected stage." />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredOpportunities.map((opportunity) => (
                    <PipelineCard key={opportunity.id} opportunity={opportunity} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Confirmed orders in the last 30 days.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingState message="Loading orders..." />
                ) : orders.length === 0 ? (
                  <EmptyState message="No sales orders yet." />
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 6).map((order) => (
                      <OrderRow key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quotations</CardTitle>
                <CardDescription>Pending approvals and expirations.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingState message="Loading quotations..." />
                ) : quotations.length === 0 ? (
                  <EmptyState message="No quotations available." />
                ) : (
                  <div className="space-y-3">
                    {quotations.slice(0, 6).map((quote) => (
                      <QuoteRow key={quote.id} quotation={quote} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
  variant: 'teal' | 'sky' | 'indigo' | 'amber' | 'purple';
}) {
  const accentMap: Record<typeof variant, string> = {
    teal: 'bg-teal-100 text-teal-600',
    sky: 'bg-sky-100 text-sky-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
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

function priorityVariant(priority: string) {
  switch (priority) {
    case 'URGENT':
      return 'destructive';
    case 'HIGH':
      return 'default';
    case 'MEDIUM':
      return 'secondary';
    default:
      return 'outline';
  }
}

function ProbabilityBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{safeValue}%</span>
        <span>100%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-teal-500" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function PipelineCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{opportunity.name}</h3>
          <p className="text-sm text-gray-500">
            {opportunity.customer?.name ? `Customer: ${opportunity.customer.name}` : 'Unassigned'}
          </p>
        </div>
        <Badge variant={stageVariant(opportunity.stage)}>{opportunity.stage}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase text-gray-500">Amount</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(opportunity.amount ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Probability</p>
          <p className="font-semibold text-gray-900">{opportunity.probability ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Expected Close</p>
          <p className="font-semibold text-gray-900">{formatDate(opportunity.expectedCloseDate)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Projected Revenue</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(((opportunity.amount ?? 0) * (opportunity.probability ?? 0)) / 100)}
          </p>
        </div>
      </div>
    </div>
  );
}

function stageVariant(stage: string) {
  switch (stage) {
    case 'won':
      return 'default';
    case 'lost':
      return 'destructive';
    case 'negotiation':
      return 'secondary';
    case 'proposal':
      return 'outline';
    case 'qualification':
      return 'outline';
    default:
      return 'secondary';
  }
}

function OrderRow({ order }: { order: SalesOrder }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
      <div>
        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
        <p className="text-xs text-gray-500">
          {order.customer?.name ?? 'Walk-in customer'} · {formatDate(order.createdAt)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total ?? 0)}</p>
        <Badge variant="secondary">{order.status}</Badge>
      </div>
    </div>
  );
}

function QuoteRow({ quotation }: { quotation: Quotation }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
      <div>
        <p className="font-semibold text-gray-900">{quotation.quoteNumber}</p>
        <p className="text-xs text-gray-500">
          {quotation.customer?.name ?? 'Walk-in customer'} · Valid until {formatDate(quotation.validUntil)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(quotation.total ?? 0)}</p>
        <Badge variant={quoteStatusVariant(quotation.status)}>
          <div className="flex items-center gap-1">
            <CalendarCheck className="h-3.5 w-3.5" />
            {quotation.status}
          </div>
        </Badge>
      </div>
    </div>
  );
}

function quoteStatusVariant(status: string) {
  switch (status) {
    case 'ACCEPTED':
      return 'default';
    case 'SENT':
      return 'secondary';
    case 'REJECTED':
    case 'EXPIRED':
      return 'destructive';
    default:
      return 'outline';
  }
}

