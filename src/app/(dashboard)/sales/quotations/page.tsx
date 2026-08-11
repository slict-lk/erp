"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, CheckCircle2, ArrowRightLeft, FileText, CalendarClock, Loader2, Trash2, ChevronsUpDown, Check, UserRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface QuoteLineDraft {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  taxPercent: string;
}

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

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
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [quoteLines, setQuoteLines] = useState<QuoteLineDraft[]>([
    { id: "l1", description: "", quantity: "1", unitPrice: "", discountPercent: "0", taxPercent: "0" },
  ]);
  const [newQuoteForm, setNewQuoteForm] = useState({
    currency: "USD", notes: "", validUntil: "",
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const loadCustomers = async (search = "") => {
    try {
      setCustomersLoading(true);
      const url = `/api/sales/customers?page=1&limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const payload = await response.json();
        const items = payload.data || payload.items || (Array.isArray(payload) ? payload : []);
        setCustomers(items);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setCustomersLoading(false);
    }
  };

  const openCreateDialog = () => {
    setFormError(null);
    setSelectedCustomerId("");
    setQuoteLines([{ id: `l${Date.now()}`, description: "", quantity: "1", unitPrice: "", discountPercent: "0", taxPercent: "0" }]);
    setNewQuoteForm({ currency: "USD", notes: "", validUntil: "" });
    setShowAdd(true);
    loadCustomers();
  };

  const addLine = () => {
    setQuoteLines(lines => [...lines, { id: `l${Date.now()}-${lines.length}`, description: "", quantity: "1", unitPrice: "", discountPercent: "0", taxPercent: "0" }]);
  };

  const removeLine = (id: string) => {
    setQuoteLines(lines => lines.length > 1 ? lines.filter(l => l.id !== id) : lines);
  };

  const updateLine = (id: string, field: keyof QuoteLineDraft, value: string) => {
    setQuoteLines(lines => lines.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const lineTotals = quoteLines.map((line) => {
    const quantity = Number(line.quantity) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    const discountPercent = Number(line.discountPercent) || 0;
    const taxPercent = Number(line.taxPercent) || 0;
    const lineSubtotal = quantity * unitPrice;
    const discountAmount = (lineSubtotal * discountPercent) / 100;
    const afterDiscount = lineSubtotal - discountAmount;
    const taxAmount = (afterDiscount * taxPercent) / 100;
    const lineTotal = afterDiscount + taxAmount;
    return { quantity, unitPrice, lineSubtotal, discountAmount, taxAmount, lineTotal };
  });

  const quoteTotals = lineTotals.reduce(
    (acc, t) => ({
      subtotal: acc.subtotal + t.lineSubtotal,
      discount: acc.discount + t.discountAmount,
      tax: acc.tax + t.taxAmount,
      grandTotal: acc.grandTotal + t.lineTotal,
    }),
    { subtotal: 0, discount: 0, tax: 0, grandTotal: 0 }
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: newQuoteForm.currency || "USD" }).format(value);

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
    const validLines = quoteLines.filter(l => l.description.trim() && Number(l.unitPrice) > 0);
    if (validLines.length === 0) {
      setFormError("Add at least one line item with a description and unit price.");
      return;
    }
    if (!selectedCustomerId) {
      setFormError("Please select a customer.");
      return;
    }
    try {
      setSubmitting(true); setFormError(null);
      const res = await fetch("/api/sales/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerAccountId: selectedCustomerId,
          currency: newQuoteForm.currency,
          validUntil: newQuoteForm.validUntil || undefined,
          notes: newQuoteForm.notes.trim() || undefined,
          lines: validLines.map(l => ({
            description: l.description.trim(),
            quantity: Number(l.quantity) || 1,
            unitPrice: Number(l.unitPrice),
            discountPercent: Number(l.discountPercent) || 0,
            taxPercent: Number(l.taxPercent) || 0,
          })),
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || "Failed to create quote"); }
      setShowAdd(false);
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
        <Button onClick={openCreateDialog}>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quote</DialogTitle>
            <DialogDescription>Create a quotation with a customer and multiple line items.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}

            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={customerOpen} className="w-full justify-between font-normal">
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2 overflow-hidden">
                        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{selectedCustomer.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{selectedCustomer.company || selectedCustomer.email}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <UserRound className="h-4 w-4 shrink-0" />
                        Select customer…
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search customers…"
                      value={customerSearch}
                      onValueChange={(v) => { setCustomerSearch(v); loadCustomers(v); }}
                    />
                    <CommandList>
                      {customersLoading ? (
                        <div className="p-4 space-y-2">
                          {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>No customers found.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.id}
                                onSelect={() => {
                                  setSelectedCustomerId(customer.id);
                                  setCustomerOpen(false);
                                  setCustomerSearch("");
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  <span className="text-xs text-muted-foreground">{customer.company || customer.email || customer.phone || "No contact info"}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedCustomer?.email && (
                <p className="text-xs text-muted-foreground">{selectedCustomer.email}{selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}</p>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Line Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Line
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Description</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-28">Unit Price</TableHead>
                      <TableHead className="w-20">Disc %</TableHead>
                      <TableHead className="w-20">Tax %</TableHead>
                      <TableHead className="w-28 text-right">Line Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quoteLines.map((line, idx) => {
                      const total = lineTotals[idx];
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Input
                              placeholder="Item description"
                              value={line.description}
                              onChange={e => updateLine(line.id, "description", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="0" step="0.01" value={line.quantity}
                              onChange={e => updateLine(line.id, "quantity", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="0" step="0.01" placeholder="0.00" value={line.unitPrice}
                              onChange={e => updateLine(line.id, "unitPrice", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="0" max="100" step="0.01" value={line.discountPercent}
                              onChange={e => updateLine(line.id, "discountPercent", e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min="0" max="100" step="0.01" value={line.taxPercent}
                              onChange={e => updateLine(line.id, "taxPercent", e.target.value)} />
                          </TableCell>
                          <TableCell className="text-right font-medium whitespace-nowrap">
                            {formatMoney(total?.lineTotal || 0)}
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => removeLine(line.id)} disabled={quoteLines.length === 1}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {quoteLines.every(l => !l.description.trim() || !Number(l.unitPrice)) && (
                <p className="text-xs text-muted-foreground">Each line needs a description and unit price.</p>
              )}
            </div>

            {/* Totals */}
            <div className="ml-auto w-full max-w-xs space-y-1.5 rounded-lg bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(quoteTotals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatMoney(quoteTotals.discount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatMoney(quoteTotals.tax)}</span></div>
              <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Grand Total</span><span>{formatMoney(quoteTotals.grandTotal)}</span></div>
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
          <DialogFooter className="gap-2">
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
