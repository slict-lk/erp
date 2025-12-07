"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  TrendingDown,
  TrendingUp,
  Warehouse,
  RefreshCw,
  Search,
  AlertTriangle,
  Archive,
  ArrowUpDown,
  Barcode,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  type: string;
  listPrice: number;
  costPrice: number;
  qtyAvailable: number;
  qtyReserved: number;
  barcode: string | null;
  isActive: boolean;
  canBeSold: boolean;
  canBePurchased: boolean;
  category: { name: string } | null;
}

interface StockMove {
  id: string;
  reference: string;
  quantity: number;
  type: string;
  date: string;
  product: { name: string; sku: string };
  warehouse: { name: string } | null;
}

interface WarehouseData {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount ?? 0);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [productsRes, stockRes, warehouseRes] = await Promise.all([
        fetch('/api/inventory/products'),
        fetch('/api/inventory/stock'),
        fetch('/api/inventory/warehouses'),
      ]);

      if (!productsRes.ok) throw new Error('Failed to load products');
      if (!stockRes.ok) throw new Error('Failed to load stock movements');
      if (!warehouseRes.ok) throw new Error('Failed to load warehouses');

      setProducts((await productsRes.json()) ?? []);
      setStockMoves((await stockRes.json()) ?? []);
      setWarehouses((await warehouseRes.json()) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) =>
        searchTerm
          ? product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      )
      .filter((product) => (typeFilter === 'ALL' ? true : product.type === typeFilter))
      .filter((product) => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'ACTIVE') return product.isActive;
        if (activeFilter === 'INACTIVE') return !product.isActive;
        return true;
      });
  }, [products, searchTerm, typeFilter, activeFilter]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.qtyAvailable * product.costPrice), 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => product.qtyAvailable < 10 && product.type === 'STORABLE');
  }, [products]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            Monitor stock levels, track product movements, and optimize warehouse operations.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <Button variant="outline" onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Products"
          value={String(products.length)}
          subtitle={`${products.filter((p) => p.isActive).length} active`}
          icon={Package}
          variant="purple"
        />
        <StatCard
          title="Warehouses"
          value={String(warehouses.length)}
          subtitle={`${warehouses.filter((w) => w.isActive).length} operational`}
          icon={Warehouse}
          variant="cyan"
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockProducts.length)}
          subtitle="Require attention"
          icon={AlertTriangle}
          variant="orange"
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(totalStockValue)}
          subtitle="Current inventory worth"
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Manage inventory items and track stock levels.</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="STORABLE">Storable</SelectItem>
                    <SelectItem value="CONSUMABLE">Consumable</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active Only</SelectItem>
                    <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading products..." />
              ) : filteredProducts.length === 0 ? (
                <EmptyState message="No products found." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">SKU</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-right">Available</th>
                        <th className="px-4 py-3 text-right">Reserved</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">{product.name}</span>
                              <span className="text-xs text-gray-500">
                                {product.category?.name ?? 'Uncategorized'}
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Barcode className="h-3.5 w-3.5 text-gray-400" />
                              {product.sku}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge variant="outline">{product.type}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                            <span
                              className={`${
                                product.qtyAvailable < 10 && product.type === 'STORABLE'
                                  ? 'text-orange-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {product.qtyAvailable}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-500">
                            {product.qtyReserved}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                            {formatCurrency(product.costPrice)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(product.listPrice)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {lowStockProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Products requiring immediate attention.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-600">
                          {product.qtyAvailable} units
                        </p>
                        <p className="text-xs text-gray-500">Low stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement History</CardTitle>
              <CardDescription>Track all inventory transactions and transfers.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading stock movements..." />
              ) : stockMoves.length === 0 ? (
                <EmptyState message="No stock movements recorded." />
              ) : (
                <div className="space-y-3">
                  {stockMoves.slice(0, 15).map((move) => (
                    <div
                      key={move.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            move.type === 'IN'
                              ? 'bg-green-100'
                              : move.type === 'OUT'
                              ? 'bg-red-100'
                              : 'bg-blue-100'
                          }`}
                        >
                          <ArrowUpDown
                            className={`h-4 w-4 ${
                              move.type === 'IN'
                                ? 'text-green-600'
                                : move.type === 'OUT'
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{move.reference}</p>
                          <p className="text-xs text-gray-500">
                            {move.product.name} · {move.warehouse?.name ?? 'No warehouse'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {move.type === 'OUT' ? '-' : '+'}
                          {move.quantity} units
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(move.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Facilities</CardTitle>
              <CardDescription>Manage storage locations and distribution centers.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading warehouses..." />
              ) : warehouses.length === 0 ? (
                <EmptyState message="No warehouses configured." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="space-y-3 rounded-xl border border-gray-200 p-4 hover:border-purple-200 hover:bg-purple-50/30"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-purple-100 p-2">
                            <Warehouse className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                            <p className="text-xs text-gray-500">Code: {warehouse.code}</p>
                          </div>
                        </div>
                        <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                          {warehouse.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {warehouse.address && (
                        <p className="text-sm text-gray-600">{warehouse.address}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  variant,
}: {
  title: string;
  subtitle: string;
  value: string;
  icon: typeof Package;
  variant: 'purple' | 'cyan' | 'orange' | 'emerald';
}) {
  const accentMap = {
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  } as const;

  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${accentMap[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-gray-500">
      {message}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-sm text-gray-500">
      {message}
    </div>
  );
}
