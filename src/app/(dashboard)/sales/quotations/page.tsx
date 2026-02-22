'use client';

import { useState, useEffect } from 'react';
import { QuotationList } from '@/components/sales/QuotationList';
import { QuotationForm } from '@/components/sales/QuotationForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, FileText, ArrowRightLeft, CalendarClock } from 'lucide-react';

interface Quotation {
  id: string;
  quotationNumber?: string;
  quoteNumber?: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  validUntil: Date;
  status: string;
  total: number;
  notes?: string;
  termsAndConditions?: string;
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
  metadata?: any;
  lines?: Array<{ id: string; description?: string; quantity?: number }>;
  revisions?: Array<{ id: string; revisionNo?: number; createdAt?: string | Date }>;
  createdAt: Date;
}

type ViewMode = 'list' | 'create' | 'edit';

function toFormQuotationStatus(status?: string | null) {
  const s = String(status || '').toUpperCase();
  if (['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(s)) {
    return s as 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  }
  return 'DRAFT' as const;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [v2Quotes, setV2Quotes] = useState<SalesQuoteV2[]>([]);
  const [v2Loading, setV2Loading] = useState(true);
  const [v2BusyQuoteId, setV2BusyQuoteId] = useState<string | null>(null);
  const [v2Filter, setV2Filter] = useState<'ALL' | 'DRAFT' | 'SENT' | 'CONVERTIBLE' | 'CONVERTED'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
    loadV2Quotes();
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  const loadQuotations = async () => {
    try {
      const response = await fetch('/api/sales/quotations');
      if (response.ok) {
        const data = await response.json();
        setQuotations((Array.isArray(data) ? data : []).map((q: any) => ({
          ...q,
          validUntil: q.validUntil ? new Date(q.validUntil) : new Date(),
        })));
      }
    } catch (error) {
      console.error('Failed to load quotations:', error);
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

  const handleCreateQuotation = async (data: any) => {
    try {
      const response = await fetch('/api/sales/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadQuotations();
        setViewMode('list');
        setActionNotice('Quotation created');
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to create quotation');
      }
    } catch (error: any) {
      console.error('Error creating quotation:', error);
      setActionNotice(error?.message || 'Failed to create quotation');
    }
  };

  const handleUpdateQuotation = async (data: any) => {
    if (!selectedQuotation) return;

    try {
      const response = await fetch(`/api/sales/quotations/${selectedQuotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadQuotations();
        setViewMode('list');
        setSelectedQuotation(null);
        setActionNotice('Quotation updated');
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update quotation');
      }
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      setActionNotice(error?.message || 'Failed to update quotation');
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/sales/quotations/${quotationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadQuotations();
        setActionNotice('Quotation deleted');
      } else {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to delete quotation');
      }
    } catch (error: any) {
      console.error('Error deleting quotation:', error);
      setActionNotice(error?.message || 'Failed to delete quotation');
    }
  };

  const handleQuotationStatusChange = async (quotation: Quotation, status: string) => {
    try {
      const response = await fetch(`/api/sales/quotations/${quotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update quotation');
      }
      await loadQuotations();
      setActionNotice(`Quotation moved to ${status}`);
    } catch (error: any) {
      console.error('Error updating quotation status:', error);
      setActionNotice(error?.message || 'Failed to update quotation status');
    }
  };

  const loadV2Quotes = async () => {
    try {
      setV2Loading(true);
      const response = await fetch('/api/sales/quotes');
      if (response.ok) {
        const data = await response.json();
        setV2Quotes((Array.isArray(data) ? data : []).map((q: any) => ({
          ...q,
          createdAt: q.createdAt ? new Date(q.createdAt) : new Date(),
          validUntil: q.validUntil ? new Date(q.validUntil) : null,
        })));
      }
    } catch (error) {
      console.error('Failed to load canonical quotes:', error);
    } finally {
      setV2Loading(false);
    }
  };

  const handleConvertToOrder = async (quotation: Quotation) => {
    if (!quotation.customerId) {
      setActionNotice('Quotation has no customer linked');
      return;
    }

    try {
      const response = await fetch('/api/sales/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: `SO-${Date.now()}`,
          customerId: quotation.customerId,
          status: 'CONFIRMED',
          sourceQuotationId: quotation.id,
          notes: `Converted from quotation ${quotation.quotationNumber || quotation.quoteNumber || quotation.id}`,
          lines: (quotation.lines || []).map((line: any) => ({
            productId: line.productId ?? null,
            description: line.description ?? 'Item',
            quantity: Number(line.quantity ?? 0),
            unitPrice: Number(line.unitPrice ?? 0),
            discount: Number(line.discount ?? 0),
            tax: Number(line.tax ?? 0),
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to convert quotation');
      }

      await fetch(`/api/sales/quotations/${quotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      }).catch(() => undefined);

      await loadQuotations();
      setActionNotice('Quotation converted to order');
    } catch (error: any) {
      console.error('Error converting quotation to order:', error);
      setActionNotice(error?.message || 'Failed to convert quotation');
    }
  };

  const handleUpdateV2QuoteStatus = async (quote: SalesQuoteV2, status: string) => {
    try {
      setV2BusyQuoteId(quote.id);
      const response = await fetch(`/api/sales/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to update canonical quote');
      }
      await loadV2Quotes();
      setActionNotice(`Canonical quote ${quote.quoteNumber} moved to ${status}`);
    } catch (error: any) {
      console.error('Error updating v2 quote status:', error);
      setActionNotice(error?.message || 'Failed to update canonical quote');
    } finally {
      setV2BusyQuoteId(null);
    }
  };

  const handleConvertV2Quote = async (quote: SalesQuoteV2) => {
    try {
      setV2BusyQuoteId(quote.id);
      const response = await fetch(`/api/sales/quotes/${quote.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DRAFT',
          markQuoteStatus: 'CONVERTED',
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to convert canonical quote');
      }
      await Promise.all([loadV2Quotes(), loadQuotations().catch(() => undefined)]);
      setActionNotice(`Canonical quote ${quote.quoteNumber} converted to order`);
    } catch (error: any) {
      console.error('Error converting v2 quote:', error);
      setActionNotice(error?.message || 'Failed to convert canonical quote');
    } finally {
      setV2BusyQuoteId(null);
    }
  };

  const filteredV2Quotes = v2Quotes.filter((quote) => {
    const status = String(quote.status || '').toUpperCase();
    if (v2Filter === 'ALL') return true;
    if (v2Filter === 'CONVERTIBLE') return !['CONVERTED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(status);
    return status === v2Filter;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading quotations...</div>
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
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Canonical Quote Control (V2)
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Canonical `SalesQuote` records with revision history and direct quote→order conversion.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['ALL', 'DRAFT', 'SENT', 'CONVERTIBLE', 'CONVERTED'] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={v2Filter === filter ? 'default' : 'outline'}
                    onClick={() => setV2Filter(filter)}
                  >
                    {filter}
                  </Button>
                ))}
                <Button size="sm" variant="outline" onClick={loadV2Quotes} disabled={v2Loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${v2Loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <MiniKpi
                  tone="slate"
                  label="V2 Quotes"
                  value={String(v2Quotes.length)}
                  hint="Canonical records"
                />
                <MiniKpi
                  tone="blue"
                  label="Convertible"
                  value={String(
                    v2Quotes.filter((q) => {
                      const s = String(q.status || '').toUpperCase();
                      return !['CONVERTED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(s);
                    }).length
                  )}
                  hint="Ready for conversion"
                />
                <MiniKpi
                  tone="amber"
                  label="Expiring 7d"
                  value={String(
                    v2Quotes.filter((q) => {
                      if (!q.validUntil) return false;
                      const t = new Date(q.validUntil).getTime();
                      const now = Date.now();
                      const s = String(q.status || '').toUpperCase();
                      return t >= now && t <= now + 7 * 86400000 && !['CONVERTED', 'EXPIRED'].includes(s);
                    }).length
                  )}
                  hint="Expiry risk"
                />
                <MiniKpi
                  tone="indigo"
                  label="Pipeline Value"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                    v2Quotes.reduce((sum, q) => sum + Number(q.grandTotal || 0), 0)
                  )}
                  hint="Canonical quote value"
                />
              </div>

              {v2Loading ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  Loading canonical quotes...
                </div>
              ) : filteredV2Quotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  No canonical quotes found for this filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredV2Quotes.slice(0, 12).map((quote) => {
                    const status = String(quote.status || '').toUpperCase();
                    const approvalStatus = String(quote.approvalStatus || '').toUpperCase();
                    const canConvert = !['CONVERTED', 'REJECTED', 'EXPIRED', 'CANCELLED'].includes(status);
                    const daysLeft = quote.validUntil
                      ? Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / 86400000)
                      : null;
                    return (
                      <div key={quote.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
                              <Badge variant={status === 'CONVERTED' ? 'default' : status === 'EXPIRED' ? 'destructive' : 'outline'}>
                                {status}
                              </Badge>
                              {approvalStatus ? <Badge variant="outline">{approvalStatus}</Badge> : null}
                              {quote.revisionNo != null ? <Badge variant="outline">Rev {quote.revisionNo}</Badge> : null}
                            </div>
                            <div className="text-xs text-gray-500">
                              Account: {quote.customerAccountId || '—'} · Opportunity: {quote.opportunityId || '—'}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: quote.currency || 'USD' }).format(Number(quote.grandTotal || 0))}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span className="rounded bg-gray-50 px-2 py-1">{(quote.lines || []).length} lines</span>
                              <span className="rounded bg-gray-50 px-2 py-1">
                                <CalendarClock className="mr-1 inline h-3 w-3" />
                                {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'No expiry'}
                                {daysLeft != null ? ` (${daysLeft}d)` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={v2BusyQuoteId === quote.id || status === 'DRAFT'}
                              onClick={() => handleUpdateV2QuoteStatus(quote, 'DRAFT')}
                            >
                              Draft
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={v2BusyQuoteId === quote.id || status === 'SENT'}
                              onClick={() => handleUpdateV2QuoteStatus(quote, 'SENT')}
                            >
                              Sent
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={v2BusyQuoteId === quote.id || status === 'APPROVED'}
                              onClick={() => handleUpdateV2QuoteStatus(quote, 'APPROVED')}
                            >
                              Approved
                            </Button>
                            <Button
                              size="sm"
                              disabled={v2BusyQuoteId === quote.id || !canConvert}
                              onClick={() => handleConvertV2Quote(quote)}
                            >
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              {v2BusyQuoteId === quote.id ? 'Converting...' : 'Convert'}
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

          <QuotationList
            quotations={quotations}
            onCreateNew={() => setViewMode('create')}
            onEdit={(quotation) => {
              setSelectedQuotation(quotation);
              setViewMode('edit');
            }}
            onDelete={handleDeleteQuotation}
            onView={(quotation) => {
              setSelectedQuotation(quotation);
              setViewMode('edit');
            }}
            onStatusChange={handleQuotationStatusChange}
            onConvertToOrder={handleConvertToOrder}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quotations
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New Quotation' : 'Edit Quotation'}
          </h1>
          <QuotationForm
            initialData={selectedQuotation ? {
              ...selectedQuotation,
              status: toFormQuotationStatus(selectedQuotation.status),
              validUntil: selectedQuotation.validUntil
                ? new Date(selectedQuotation.validUntil).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            } : undefined}
            customers={customers}
            products={products}
            onSubmit={viewMode === 'create' ? handleCreateQuotation : handleUpdateQuotation}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}

function MiniKpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'slate' | 'blue' | 'amber' | 'indigo';
}) {
  const tones: Record<typeof tone, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-90">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-xs opacity-80">{hint}</p>
    </div>
  );
}
