'use client';

import { useState, useEffect } from 'react';
import { ProductList } from '@/components/inventory/ProductList';
import { ProductForm } from '@/components/inventory/ProductForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: 'STORABLE' | 'CONSUMABLE' | 'SERVICE';
  listPrice: number;
  costPrice?: number;
  qtyAvailable: number;
  barcode?: string;
  weight?: number;
  volume?: number;
  canBeSold?: boolean;
  canBePurchased?: boolean;
  isActive: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  _count: {
    products: number;
    children: number;
  };
}

type ViewMode = 'list' | 'create' | 'edit';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/inventory/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/inventory/categories?includeChildren=true');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreateProduct = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadProducts();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    }
  };

  const handleUpdateProduct = async (data: any) => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/inventory/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadProducts();
        setViewMode('list');
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/inventory/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === 'list' ? (
        <ProductList
          products={products}
          onCreateNew={() => setViewMode('create')}
          onEdit={(product) => {
            setSelectedProduct(product);
            setViewMode('edit');
          }}
          onView={(product) => {
            setSelectedProduct(product);
            setViewMode('edit');
          }}
          onDelete={handleDeleteProduct}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New Product' : 'Edit Product'}
          </h1>
          <ProductForm
            initialData={selectedProduct ? {
              ...selectedProduct,
              canBeSold: selectedProduct.canBeSold ?? true,
              canBePurchased: selectedProduct.canBePurchased ?? true
            } : undefined}
            categories={categories}
            onSubmit={viewMode === 'create' ? handleCreateProduct : handleUpdateProduct}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}
