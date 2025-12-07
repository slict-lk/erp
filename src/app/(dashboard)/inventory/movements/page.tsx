'use client';

import { useState, useEffect } from 'react';
import { StockMovementList } from '@/components/inventory/StockMovementList';
import { StockMovementForm } from '@/components/inventory/StockMovementForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  warehouseId: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  toWarehouseId?: string;
  toWarehouse?: {
    id: string;
    name: string;
    code: string;
  };
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reference?: string;
  reason?: string;
  movementDate: Date;
  createdAt: Date;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  qtyAvailable: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

type ViewMode = 'list' | 'create' | 'view';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMovements();
    loadProducts();
    loadWarehouses();
  }, []);

  const loadMovements = async () => {
    try {
      const response = await fetch('/api/inventory/movements');
      if (response.ok) {
        const data = await response.json();
        setMovements(data);
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error);
    } finally {
      setIsLoading(false);
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

  const loadWarehouses = async () => {
    try {
      const response = await fetch('/api/inventory/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const handleCreateMovement = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadMovements();
        await loadProducts(); // Refresh products to get updated quantities
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating stock movement:', error);
      alert('Failed to create stock movement');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading stock movements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === 'list' ? (
        <StockMovementList
          movements={movements}
          onCreateNew={() => setViewMode('create')}
          onView={(movement) => {
            setSelectedMovement(movement);
            setViewMode('view');
          }}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stock Movements
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Record Stock Movement' : 'View Stock Movement'}
          </h1>
          {viewMode === 'create' && (
            <StockMovementForm
              products={products}
              warehouses={warehouses}
              onSubmit={handleCreateMovement}
              onCancel={() => setViewMode('list')}
            />
          )}
          {viewMode === 'view' && selectedMovement && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Movement Details</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Type:</span> {selectedMovement.type}
                </div>
                <div>
                  <span className="font-medium">Product:</span>{' '}
                  {selectedMovement.product?.name} ({selectedMovement.product?.sku})
                </div>
                <div>
                  <span className="font-medium">Quantity:</span> {selectedMovement.quantity}
                </div>
                <div>
                  <span className="font-medium">Warehouse:</span>{' '}
                  {selectedMovement.warehouse?.name}
                </div>
                {selectedMovement.toWarehouse && (
                  <div>
                    <span className="font-medium">To Warehouse:</span>{' '}
                    {selectedMovement.toWarehouse.name}
                  </div>
                )}
                {selectedMovement.reference && (
                  <div>
                    <span className="font-medium">Reference:</span> {selectedMovement.reference}
                  </div>
                )}
                {selectedMovement.reason && (
                  <div>
                    <span className="font-medium">Reason:</span> {selectedMovement.reason}
                  </div>
                )}
                <div>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(selectedMovement.movementDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
