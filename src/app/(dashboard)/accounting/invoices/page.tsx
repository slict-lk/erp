'use client';

import { useState, useEffect } from 'react';
import { InvoiceList } from '@/components/accounting/InvoiceList';
import { InvoiceForm } from '@/components/accounting/InvoiceForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  issueDate: Date;
  dueDate: Date;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  total: number;
  amountPaid: number;
  lines: any[];
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadProducts();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/accounting/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
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

  const handleCreateInvoice = async (data: any) => {
    try {
      const response = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadInvoices();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const handleUpdateInvoice = async (data: any) => {
    if (!selectedInvoice) return;

    try {
      const response = await fetch(`/api/accounting/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadInvoices();
        setViewMode('list');
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/accounting/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadInvoices();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === 'list' ? (
        <InvoiceList
          invoices={invoices}
          onCreateNew={() => setViewMode('create')}
          onEdit={(invoice) => {
            setSelectedInvoice(invoice);
            setViewMode('edit');
          }}
          onDelete={handleDeleteInvoice}
          onView={(invoice) => {
            setSelectedInvoice(invoice);
            setViewMode('edit');
          }}
        />
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
          </h1>
          <InvoiceForm
            initialData={selectedInvoice ? {
              ...selectedInvoice,
              issueDate: selectedInvoice.issueDate.toISOString().split('T')[0],
              dueDate: selectedInvoice.dueDate.toISOString().split('T')[0]
            } : undefined}
            customers={customers}
            products={products}
            onSubmit={viewMode === 'create' ? handleCreateInvoice : handleUpdateInvoice}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}
