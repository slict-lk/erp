'use client';

import { useState, useEffect } from 'react';
import { QuotationList } from '@/components/sales/QuotationList';
import { QuotationForm } from '@/components/sales/QuotationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  validUntil: Date;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
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

type ViewMode = 'list' | 'create' | 'edit';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuotations();
    loadCustomers();
    loadProducts();
  }, []);

  const loadQuotations = async () => {
    try {
      const response = await fetch('/api/sales/quotations');
      if (response.ok) {
        const data = await response.json();
        setQuotations(data);
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
        setCustomers(data);
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
        setProducts(data);
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
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('Failed to create quotation');
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
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
      alert('Failed to update quotation');
    }
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/sales/quotations/${quotationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadQuotations();
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Failed to delete quotation');
    }
  };

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
      {viewMode === 'list' ? (
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
        />
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
              validUntil: selectedQuotation.validUntil.toISOString().split('T')[0]
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
