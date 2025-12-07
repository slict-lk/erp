'use client';

import { useState, useEffect } from 'react';
import { WarehouseList } from '@/components/inventory/WarehouseList';
import { WarehouseForm } from '@/components/inventory/WarehouseForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  _count?: {
    stockLocations: number;
  };
}

type ViewMode = 'list' | 'create' | 'edit';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await fetch('/api/inventory/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWarehouse = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadWarehouses();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating warehouse:', error);
      alert('Failed to create warehouse');
    }
  };

  const handleUpdateWarehouse = async (data: any) => {
    if (!selectedWarehouse) return;

    try {
      const response = await fetch(`/api/inventory/warehouses/${selectedWarehouse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadWarehouses();
        setViewMode('list');
        setSelectedWarehouse(null);
      }
    } catch (error) {
      console.error('Error updating warehouse:', error);
      alert('Failed to update warehouse');
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/inventory/warehouses/${warehouseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadWarehouses();
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      alert('Failed to delete warehouse');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading warehouses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === 'list' ? (
        <WarehouseList
          warehouses={warehouses}
          onCreateNew={() => setViewMode('create')}
          onEdit={(warehouse) => {
            setSelectedWarehouse(warehouse);
            setViewMode('edit');
          }}
          onDelete={handleDeleteWarehouse}
          onView={(warehouse) => {
            setSelectedWarehouse(warehouse);
            setViewMode('edit');
          }}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Warehouses
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New Warehouse' : 'Edit Warehouse'}
          </h1>
          <WarehouseForm
            initialData={selectedWarehouse || undefined}
            onSubmit={viewMode === 'create' ? handleCreateWarehouse : handleUpdateWarehouse}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}
