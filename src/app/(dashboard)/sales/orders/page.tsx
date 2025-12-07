'use client';

import { useState, useEffect } from 'react';
import { SalesOrderList } from '@/components/sales/SalesOrderList';
import { SalesOrderForm } from '@/components/sales/SalesOrderForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
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

type ViewMode = 'list' | 'create' | 'edit';

export default function SalesOrdersPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSalesOrders();
    loadCustomers();
    loadProducts();
  }, []);

  const loadSalesOrders = async () => {
    try {
      const response = await fetch('/api/sales/orders');
      if (response.ok) {
        const data = await response.json();
        setSalesOrders(data);
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
      }
    } catch (error) {
      console.error('Error creating sales order:', error);
      alert('Failed to create sales order');
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
      }
    } catch (error) {
      console.error('Error updating sales order:', error);
      alert('Failed to update sales order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/sales/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadSalesOrders();
      }
    } catch (error) {
      console.error('Error deleting sales order:', error);
      alert('Failed to delete sales order');
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
      {viewMode === 'list' ? (
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
        />
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
