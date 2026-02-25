"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, XCircle, ArrowRightLeft, FileText, CalendarClock, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SalesQuoteV2 {
  id: string;
  quoteNumber: string;
  status: string;
  approvalStatus?: string;
  customerAccountId?: string | null;
  opportunityId?: string | null;
  currency?: string;
  validUntil?: Date | null;
  grandTotal: number;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  revisionNo?: number;
  lines?: Array<any>;
  createdAt: Date;
}

export default function SalesQuotesPage() {
  const [quotes, setQuotes] = useState<SalesQuoteV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'SENT' | 'CONVERTIBLE' | 'CONVERTED'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newQuoteForm, setNewQuoteForm] = useState({
    description: "", quantity: "1", unitPrice: "", currency: "USD", notes: "", validUntil: "",
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sales/quotes");
      if (response.ok) {
        const payload = await response.json();
        const items = payload.items || payload.data || (Array.isArray(payload) ? payload : []);
        setQuotes(items.map((q: any) => ({
          ...q,
          createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
          validUntil: q.validUntil ? new Date(q.validUntil) : null,
        })));
      }
    } catch (error) {
      console.error("Failed to load canonical quotes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (quoteId: string, status: string) => {
    try {
      const response = await fetch(`/api/sales/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await loadQuotes();
        setActionNotice(`Quote moved to ${status}`);
      }
    } catch (error) {
      console.error("Error updating quote status:", error);
    }
  };

  const handleConvertToOrder = async (quote: SalesQuoteV2) => {
    try {
      const response = await fetch(`/api/sales/quotes/${quote.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DRAFT", markQuoteStatus: "CONVERTED" }),
      });
      if (response.ok) {
        await loadQuotes();
        setActionNotice(`Quote ${quote.quoteNumber} converted to order`);
      }
    } catch (error) {
      console.error("Error converting quote:", error);
    }
  };

  const handleCreateQuote = async () => {
    if (!newQuoteForm.description.trim() || !newQuoteForm.unitPrice) {
      setFormError("Description and unit price are required.");
      return;
    }
    try {
      setSubmitting(true); setFormError(null);
      const res = await fetch("/api/sales/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: newQuoteForm.currency,
          validUntil: newQuoteForm.validUntil || undefined,
          notes: newQuoteForm.notes.trim() || undefined,
          lines: [{
            description: newQuoteForm.description.trim(),
            quantity: Number(newQuoteForm.quantity) || 1,
            unitPrice: Number(newQuoteForm.unitPrice),
          }],
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || "Failed to create quote"); }
      setShowAdd(false);
      setNewQuoteForm({ description: "", quantity: "1", unitPrice: "", currency: "USD", notes: "", validUntil: "" });
      await loadQuotes();
      setActionNotice("New quote created successfully");
    } catch (err: any) { setFormError(err?.message || "Failed to create quote."); }
    finally { setSubmitting(false); }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const status = String(quote.status || "").toUpperCase();
    if (filter === "ALL") return true;
    if (filter === "CONVERTIBLE") return !["CONVERTED", "CANCELLED", "REJECTED", "EXPIRED"].includes(status);
    return status === filter;
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
          <h1 className="text-3xl font-bold tracking-tight">Quotes Builder (V2)</h1>
          <p className="text-muted-foreground mt-2">
            Create, revise, and convert quotations into sales orders.
          </p>
        </div>
        <Button onClick={() => { setShowAdd(true); setFormError(null); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MiniKpi tone="slate" label="Total Quotes" value={String(quotes.length)} hint="All canonical records" />
        <MiniKpi
          tone="blue"
          label="Convertible"
          value={String(quotes.filter((q) => !["CONVERTED", "REJECTED", "EXPIRED", "CANCELLED"].includes(String(q.status).toUpperCase())).length)}
          hint="Ready for order generation"
        />
        <MiniKpi
          tone="amber"
          label="Expiring Soon"
          value={String(quotes.filter((q) => {
            if (!q.validUntil) return false;
            const t = new Date(q.validUntil).getTime();
            const now = Date.now();
            return t >= now && t <= now + 7 * 86400000 && !["CONVERTED", "EXPIRED"].includes(String(q.status).toUpperCase());
          }).length)}
          hint="Next 7 days"
        />
        <MiniKpi
          tone="indigo"
          label="Pipeline Value"
          value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
            quotes.reduce((sum, q) => sum + Number(q.grandTotal || 0), 0)
          )}
          hint="Sum of all quotes"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Quotations Directory</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["ALL", "DRAFT", "SENT", "CONVERTIBLE", "CONVERTED"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center p-8 border-dashed border-2 rounded-lg bg-muted/20">
              <p className="text-muted-foreground text-sm">No canonical quotes found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotes.map((quote) => {
                const status = String(quote.status || "").toUpperCase();
                const approvalStatus = String(quote.approvalStatus || "").toUpperCase();
                const canConvert = !["CONVERTED", "REJECTED", "EXPIRED", "CANCELLED"].includes(status);

                return (
                  <div key={quote.id} className="rounded-xl border border-gray-200 p-4 transition-all hover:shadow-sm bg-card">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{quote.quoteNumber}</p>
                          <Badge variant={status === "CONVERTED" ? "default" : status === "EXPIRED" ? "destructive" : "outline"}>
                            {status}
                          </Badge>
                          {approvalStatus && <Badge variant="secondary">{approvalStatus}</Badge>}
                          {quote.revisionNo != null && <Badge variant="outline">Rev {quote.revisionNo}</Badge>}
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency || "USD" }).format(Number(quote.grandTotal || 0))}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 rounded bg-muted px-2 py-1">
                            <FileText className="h-3 w-3" /> {(quote.lines || []).length} items
                          </span>
                          <span className="flex items-center gap-1 rounded bg-muted px-2 py-1">
                            <CalendarClock className="h-3 w-3" />
                            {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : "No expiry"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" disabled={status === "DRAFT"} onClick={() => handleUpdateStatus(quote.id, "DRAFT")}>
                          Draft
                        </Button>
                        <Button size="sm" variant="outline" disabled={status === "SENT"} onClick={() => handleUpdateStatus(quote.id, "SENT")}>
                          Sent
                        </Button>
                        <Button size="sm" disabled={!canConvert} onClick={() => handleConvertToOrder(quote)}>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Convert to Order
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

      {/* New Quote Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) setFormError(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Quote</DialogTitle>
            <DialogDescription>Create a new quotation with at least one line item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="space-y-1.5">
              <Label htmlFor="q-desc">Line Item Description *</Label>
              <Input id="q-desc" placeholder="Professional services — Q1 2026" value={newQuoteForm.description}
                onChange={e => setNewQuoteForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="q-qty">Quantity</Label>
                <Input id="q-qty" type="number" min="0.01" step="0.01" placeholder="1" value={newQuoteForm.quantity}
                  onChange={e => setNewQuoteForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-price">Unit Price *</Label>
                <Input id="q-price" type="number" min="0" placeholder="5000" value={newQuoteForm.unitPrice}
                  onChange={e => setNewQuoteForm(f => ({ ...f, unitPrice: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={newQuoteForm.currency} onValueChange={v => setNewQuoteForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="LKR">LKR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-valid">Valid Until</Label>
                <Input id="q-valid" type="date" value={newQuoteForm.validUntil}
                  onChange={e => setNewQuoteForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-notes">Notes</Label>
              <Input id="q-notes" placeholder="Optional terms or remarks" value={newQuoteForm.notes}
                onChange={e => setNewQuoteForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleCreateQuote} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniKpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "slate" | "blue" | "amber" | "indigo" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-90">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-80 mt-1">{hint}</p>
    </div>
  );
}
