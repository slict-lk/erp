"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, PackagePlus, RefreshCw, CheckCircle2 } from "lucide-react";

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
  approvals?: Array<{ status: string; ruleCode?: string; reason?: string }>;
  fulfillmentRequests?: Array<{ id: string; status: string; requestNumber?: string }>;
}

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrderV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'FULFILLMENT'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sales/orders?v2=1");
      if (response.ok) {
        const payload = await response.json();
        const items = payload.items || payload.data || (Array.isArray(payload) ? payload : []);
        setOrders(items.map((o: any) => ({
          ...o,
          createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
          expectedDeliveryDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate) : null,
        })));
      }
    } catch (error) {
      console.error("Failed to load canonical sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setBusyOrderId(orderId);
      const response = await fetch(`/api/sales/orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reason: status === 'APPROVED' ? 'Approved from Order Control Panel' : 'Rejected from Order Control Panel',
          ruleCode: 'MANUAL_REVIEW',
        }),
      });
      if (response.ok) {
        await loadOrders();
        setActionNotice(`Order ${status.toLowerCase()}`);
      }
    } catch (error) {
      console.error("Error approving order:", error);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleRequestFulfillment = async (orderId: string) => {
    try {
      setBusyOrderId(orderId);
      const response = await fetch(`/api/sales/orders/${orderId}/fulfillment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentType: 'INVENTORY',
          markStatus: 'REQUESTED',
          orderStatus: 'IN_PROGRESS',
        }),
      });
      if (response.ok) {
        await loadOrders();
        setActionNotice(`Fulfillment requested`);
      }
    } catch (error) {
      console.error("Error creating fulfillment request:", error);
    } finally {
      setBusyOrderId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const approval = String(order.approvalStatus || "").toUpperCase();
    const fulfillment = String(order.fulfillmentStatus || "").toUpperCase();
    if (filter === "ALL") return true;
    if (filter === "PENDING") return approval === "PENDING";
    if (filter === "APPROVED") return approval === "APPROVED" || String(order.status).toUpperCase() === "CONFIRMED";
    if (filter === "FULFILLMENT") return ["REQUESTED", "PENDING", "IN_PROGRESS"].includes(fulfillment);
    return true;
  });

  return (
    <div className="space-y-6">
      {actionNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <CheckCircle2 className="h-4 w-4" />
          {actionNotice}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Workspace (V2)</h1>
          <p className="text-muted-foreground mt-2">
            Manage sales orders, approvals, and fulfillment handoffs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MiniKpi tone="slate" label="Total Orders" value={String(orders.length)} hint="Active canonical orders" />
        <MiniKpi
          tone="amber"
          label="Pending Approval"
          value={String(orders.filter((o) => String(o.approvalStatus).toUpperCase() === 'PENDING').length)}
          hint="Blocked by thresholds"
        />
        <MiniKpi
          tone="blue"
          label="Awaiting Fulfillment"
          value={String(orders.filter((o) => String(o.fulfillmentStatus).toUpperCase() === 'REQUESTED').length)}
          hint="Sent to inventory"
        />
        <MiniKpi
          tone="red"
          label="Approval Exposure"
          value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
            orders.filter((o) => String(o.approvalStatus).toUpperCase() === 'PENDING').reduce((sum, o) => sum + Number(o.grandTotal || 0), 0)
          )}
          hint="Value of blocked orders"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Order Control Panel
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'PENDING', 'APPROVED', 'FULFILLMENT'] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4 text-center py-10 text-muted-foreground text-sm border-dashed border-2 rounded-lg">
              Loading canonical V2 orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center p-8 border-dashed border-2 rounded-lg bg-muted/20">
              <p className="text-muted-foreground text-sm">No canonical orders found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const approval = String(order.approvalStatus || "").toUpperCase();
                const fulfillment = String(order.fulfillmentStatus || "").toUpperCase();
                const canApprove = approval === "PENDING";
                const canFulfill = approval === "APPROVED" && !["REQUESTED", "IN_PROGRESS", "FULFILLED"].includes(fulfillment);
                const triggers = order.metadata?.approvalEvaluation?.triggers ?? (order.approvals || []).filter((a) => String(a.status).toUpperCase() === "PENDING");

                return (
                  <div key={order.id} className="rounded-xl border border-gray-200 p-4 bg-card hover:shadow-sm transition-all">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{order.orderNumber}</p>
                          <Badge variant={approval === "PENDING" ? "secondary" : approval === "REJECTED" ? "destructive" : "outline"}>
                            Apprl: {approval || "NOT_REQUIRED"}
                          </Badge>
                          <Badge variant="outline">Stat: {String(order.status || "").toUpperCase()}</Badge>
                          <Badge variant="outline">Fulf: {fulfillment || "NOT_STARTED"}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Account: {order.customerAccountId || "—"} · Quote: {order.sourceQuoteId || "—"}
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(order.grandTotal || 0))}
                        </div>

                        {/* Approval Triggers */}
                        {Array.isArray(triggers) && triggers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {triggers.slice(0, 3).map((t: any, i: number) => (
                              <div key={i} className="flex items-start gap-2 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 border border-amber-200">
                                <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
                                <span>{t.reason || t.ruleCode || "Approval manually required"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canApprove || busyOrderId === order.id}
                          onClick={() => handleApproveOrder(order.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canApprove || busyOrderId === order.id}
                          onClick={() => handleApproveOrder(order.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canFulfill || busyOrderId === order.id}
                          onClick={() => handleRequestFulfillment(order.id)}
                        >
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Handoff to Inventory
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniKpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "slate" | "amber" | "blue" | "red" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-90">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-80 mt-1">{hint}</p>
    </div>
  );
}
