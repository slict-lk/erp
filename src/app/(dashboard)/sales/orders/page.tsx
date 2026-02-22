'use client';

import { useState, useEffect } from 'react';
import { SalesOrderList } from '@/components/sales/SalesOrderList';
import { SalesOrderForm } from '@/components/sales/SalesOrderForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, ShieldCheck, ShieldAlert, Truck, PackagePlus } from 'lucide-react';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  orderDate: Date;
  deliveryDate?: Date;
  status: string;
  total: number;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  lines: any[];
  createdAt: Date;
}

interface Customer {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  listPrice: number;
  sku?: string;
}

interface SalesOrderV2 {
  id: string;
  orderNumber: string;
  status: string;
  approvalStatus: string;
  fulfillmentStatus: string;
  invoiceStatus: string;
  customerAccountId?: string | null;
  sourceQuoteId?: string | null;
  grandTotal: number;
  approvalReason?: string | null;
  expectedDeliveryDate?: Date | null;
  createdAt: Date;
  metadata?: any;
  approvals?: Array<{
    id: string;
    status: string;
    ruleCode?: string | null;
    reason?: string | null;
  }>;
  fulfillmentRequests?: Array<{
    id: string;
    status: string;
    requestNumber?: string | null;
  }>;
}

type ViewMode = 'list' | 'create' | 'edit';

function toFormOrderStatus(status?: string | null) {
  const s = String(status || '').toUpperCase();
  if (['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'].includes(s)) {
    return s as 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  }
  return 'DRAFT' as const;
}

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [v2Orders, setV2Orders] = useState<SalesOrderV2[]>([]);
  const [v2Loading, setV2Loading] = useState(true);
  const [v2BusyOrderId, setV2BusyOrderId] = useState<string | null>(null);
  const [v2Filter, setV2Filter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FULFILLMENT'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSalesOrders();
    loadSalesOrdersV2();
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const loadSalesOrders = async () => {
    try {
      const response = await fetch('/api/sales/orders');
      if (response.ok) {
        const data = await response.json();
        setSalesOrders((Array.isArray(data) ? data : []).map((o: any) => ({
          ...o,
          orderDate: o.orderDate ? new Date(o.orderDate) : new Date(),
          deliveryDate: o.deliveryDate ? new Date(o.deliveryDate) : undefined,
        })));
      }
    } catch (error) {
      console.error('Failed to load sales orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/sales/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : (data.data || data.items || []));
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : (data.data || data.items || data.products || []));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleCreateOrder = async (data: any) => {
    try {
      const response = await fetch('/api/sales/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadSalesOrders();
        setViewMode('list');
        setActionNotice('Sales order created');
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create sales order');
      }
    } catch (error: any) {
      console.error('Error creating sales order:', error);
      setActionNotice(error?.message || 'Failed to create sales order');
    }
  };

  const handleUpdateOrder = async (data: any) => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/sales/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadSalesOrders();
        setViewMode('list');
        setSelectedOrder(null);
        setActionNotice('Sales order updated');
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update sales order');
      }
    } catch (error: any) {
      console.error('Error updating sales order:', error);
      setActionNotice(error?.message || 'Failed to update sales order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/sales/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSalesOrders();
        setActionNotice('Sales order deleted');
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to delete sales order');
      }
    } catch (error: any) {
      console.error('Error deleting sales order:', error);
      setActionNotice(error?.message || 'Failed to delete sales order');
    }
  };

  const handleOrderStatusChange = async (order: SalesOrder, status: string) => {
    try {
      const response = await fetch(`/api/sales/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update order status');
      }

      await loadSalesOrders();
      setActionNotice(`Order moved to ${status}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      setActionNotice(error?.message || 'Failed to update order status');
    }
  };

  const handleApproveV2Order = async (order: SalesOrderV2, status: 'APPROVED' | 'REJECTED') => {
    try {
      setV2BusyOrderId(order.id);
      const response = await fetch(`/api/sales/orders/${order.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reason:
            status === 'APPROVED'
              ? 'Approved from Order Control Panel'
              : 'Rejected from Order Control Panel',
          ruleCode: 'MANUAL_REVIEW',
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || `Failed to ${status.toLowerCase()} order`);
      }
      await loadSalesOrdersV2();
      setActionNotice(`Order ${order.orderNumber} ${status.toLowerCase()}`);
    } catch (error: any) {
      console.error('Error approving v2 order:', error);
      setActionNotice(error?.message || 'Approval action failed');
    } finally {
      setV2BusyOrderId(null);
    }
  };

  const handleCreateV2Fulfillment = async (order: SalesOrderV2) => {
    try {
      setV2BusyOrderId(order.id);
      const response = await fetch(`/api/sales/orders/${order.id}/fulfillment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentType: 'INVENTORY',
          markStatus: 'REQUESTED',
          orderStatus: 'IN_PROGRESS',
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create fulfillment request');
      }
      await loadSalesOrdersV2();
      setActionNotice(`Fulfillment request created for ${order.orderNumber}`);
    } catch (error: any) {
      console.error('Error creating fulfillment request:', error);
      setActionNotice(error?.message || 'Failed to create fulfillment request');
    } finally {
      setV2BusyOrderId(null);
    }
  };

  const filteredV2Orders = v2Orders.filter((order) => {
    if (v2Filter === 'ALL') return true;
    const approval = String(order.approvalStatus || '').toUpperCase();
    const fulfillment = String(order.fulfillmentStatus || '').toUpperCase();
    if (v2Filter === 'PENDING') return approval === 'PENDING';
    if (v2Filter === 'APPROVED') return approval === 'APPROVED' || String(order.status || '').toUpperCase() === 'CONFIRMED';
    if (v2Filter === 'FULFILLMENT') return ['REQUESTED', 'PENDING', 'IN_PROGRESS'].includes(fulfillment);
    return true;
  });

  const loadSalesOrdersV2 = async () => {
    try {
      setV2Loading(true);
      const response = await fetch('/api/sales/orders?v2=1');
      if (response.ok) {
        const data = await response.json();
        setV2Orders((Array.isArray(data) ? data : []).map((o: any) => ({
          ...o,
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
          expectedDeliveryDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate) : null,
        })));
      }
    } catch (error) {
      console.error('Failed to load canonical sales orders:', error);
    } finally {
      setV2Loading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading sales orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {actionNotice ? (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {actionNotice}
        </div>
      ) : null}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Advanced Order Control (V2)
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Canonical order approvals, approval triggers, and fulfillment gating.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={v2Filter === 'ALL' ? 'default' : 'outline'} onClick={() => setV2Filter('ALL')}>All</Button>
                <Button size="sm" variant={v2Filter === 'PENDING' ? 'default' : 'outline'} onClick={() => setV2Filter('PENDING')}>Pending</Button>
                <Button size="sm" variant={v2Filter === 'APPROVED' ? 'default' : 'outline'} onClick={() => setV2Filter('APPROVED')}>Approved</Button>
                <Button size="sm" variant={v2Filter === 'FULFILLMENT' ? 'default' : 'outline'} onClick={() => setV2Filter('FULFILLMENT')}>Fulfillment</Button>
                <Button size="sm" variant="outline" onClick={loadSalesOrdersV2} disabled={v2Loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${v2Loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <KpiCard tone="slate" label="V2 Orders" value={String(v2Orders.length)} hint="Canonical records" />
                <KpiCard
                  tone="amber"
                  label="Pending Approval"
                  value={String(v2Orders.filter((o) => String(o.approvalStatus).toUpperCase() === 'PENDING').length)}
                  hint="Requires review"
                />
                <KpiCard
                  tone="blue"
                  label="Fulfillment Requested"
                  value={String(v2Orders.filter((o) => String(o.fulfillmentStatus).toUpperCase() === 'REQUESTED').length)}
                  hint="Execution queue"
                />
                <KpiCard
                  tone="red"
                  label="Pending Value"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                    v2Orders
                      .filter((o) => String(o.approvalStatus).toUpperCase() === 'PENDING')
                      .reduce((sum, o) => sum + Number(o.grandTotal || 0), 0)
                  )}
                  hint="Approval exposure"
                />
              </div>

              {v2Loading ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  Loading canonical V2 orders...
                </div>
              ) : filteredV2Orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  No canonical V2 orders found for this filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredV2Orders.slice(0, 12).map((order) => {
                    const approval = String(order.approvalStatus || '').toUpperCase();
                    const fulfillment = String(order.fulfillmentStatus || '').toUpperCase();
                    const canApprove = approval === 'PENDING';
                    const canFulfill =
                      approval === 'APPROVED' && !['REQUESTED', 'IN_PROGRESS', 'FULFILLED'].includes(fulfillment);
                    const triggers =
                      order.metadata?.approvalEvaluation?.triggers ??
                      (order.approvals || []).filter((a) => String(a.status).toUpperCase() === 'PENDING');
                    return (
                      <div key={order.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                              <Badge variant={approval === 'PENDING' ? 'secondary' : approval === 'REJECTED' ? 'destructive' : 'outline'}>
                                {approval || 'NOT_REQUIRED'}
                              </Badge>
                              <Badge variant="outline">{String(order.status || '').toUpperCase()}</Badge>
                              <Badge variant="outline">{fulfillment || 'NOT_STARTED'}</Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Account: {order.customerAccountId || '—'} · Source Quote: {order.sourceQuoteId || '—'}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(order.grandTotal || 0))}
                            </div>
                            {order.approvalReason ? (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                <span className="font-medium">Reason:</span> {order.approvalReason}
                              </div>
                            ) : null}
                            {Array.isArray(triggers) && triggers.length > 0 ? (
                              <div className="space-y-1">
                                {triggers.slice(0, 3).map((t: any, i: number) => (
                                  <div key={`${order.id}-${i}`} className="flex items-start gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700">
                                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 text-amber-600" />
                                    <span>{t.reason || t.ruleCode || 'Approval trigger'}</span>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button size="sm" variant="outline" disabled={!canApprove || v2BusyOrderId === order.id} onClick={() => handleApproveV2Order(order, 'APPROVED')}>
                              {v2BusyOrderId === order.id ? 'Working...' : 'Approve'}
                            </Button>
                            <Button size="sm" variant="outline" disabled={!canApprove || v2BusyOrderId === order.id} onClick={() => handleApproveV2Order(order, 'REJECTED')}>
                              Reject
                            </Button>
                            <Button size="sm" disabled={!canFulfill || v2BusyOrderId === order.id} onClick={() => handleCreateV2Fulfillment(order)}>
                              <PackagePlus className="mr-2 h-4 w-4" />
                              {v2BusyOrderId === order.id ? 'Working...' : 'Request Fulfillment'}
                            </Button>
                          </div>
                        </div>
                        {Array.isArray(order.fulfillmentRequests) && order.fulfillmentRequests.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.fulfillmentRequests.slice(0, 3).map((req) => (
                              <Badge key={req.id} variant="outline" className="gap-1">
                                <Truck className="h-3 w-3" />
                                {req.requestNumber || req.id.slice(0, 8)} · {String(req.status || '').toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <SalesOrderList
            salesOrders={salesOrders}
            onCreateNew={() => setViewMode('create')}
            onEdit={(order) => {
              setSelectedOrder(order);
              setViewMode('edit');
            }}
            onDelete={handleDeleteOrder}
            onView={(order) => {
              setSelectedOrder(order);
              setViewMode('edit');
            }}
            onStatusChange={handleOrderStatusChange}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales Orders
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create Sales Order' : 'Edit Sales Order'}
          </h1>
          <SalesOrderForm
            initialData={selectedOrder ? {
              ...selectedOrder,
              status: toFormOrderStatus(selectedOrder.status),
              orderDate: selectedOrder.orderDate.toISOString().split('T')[0],
              deliveryDate: selectedOrder.deliveryDate
                ? selectedOrder.deliveryDate.toISOString().split('T')[0]
                : undefined
            } : undefined}
            customers={customers}
            products={products}
            onSubmit={viewMode === 'create' ? handleCreateOrder : handleUpdateOrder}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'slate' | 'amber' | 'blue' | 'red';
}) {
  const tones: Record<typeof tone, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-90">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-xs opacity-80">{hint}</p>
    </div>
  );
}
