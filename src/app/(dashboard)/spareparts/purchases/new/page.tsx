"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, Loader2, FileText, Plus, Trash2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Supplier {
    id: string;
    name: string;
    leadTimeDays: number;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    costPrice: number;
    stockQty: number;
}

interface OrderItem {
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export default function NewPurchaseOrderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [expectedDate, setExpectedDate] = useState('');
    const [items, setItems] = useState<OrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notes, setNotes] = useState('');

    const fetchSuppliers = useCallback(async () => {
        const res = await fetch('/api/spareparts/suppliers');
        if (res.ok) {
            const data = await res.json();
            setSuppliers(data.suppliers || []);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        const res = await fetch(`/api/spareparts/products?search=${searchTerm}&limit=20`);
        if (res.ok) {
            const data = await res.json();
            setProducts(data.products || []);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
    }, [fetchSuppliers, fetchProducts]);

    const addItem = (product: Product) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            setItems(items.map(i =>
                i.productId === product.id
                    ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
                    : i
            ));
        } else {
            setItems([...items, {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                quantity: 1,
                unitPrice: product.costPrice,
                lineTotal: product.costPrice,
            }]);
        }
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(items.map(i =>
            i.productId === productId
                ? { ...i, quantity, lineTotal: quantity * i.unitPrice }
                : i
        ));
    };

    const removeItem = (productId: string) => {
        setItems(items.filter(i => i.productId !== productId));
    };

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier || items.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select a supplier and add items',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/spareparts/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierId: selectedSupplier,
                    expectedDate: expectedDate || null,
                    notes,
                    items: items.map(i => ({
                        productId: i.productId,
                        productName: i.productName,
                        productSku: i.productSku,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Success',
                    description: 'Purchase order created successfully',
                });
                router.push('/spareparts/purchases');
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create order');
            }
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create order',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <Link href="/spareparts/purchases">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    New Purchase Order
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Create a purchase order for your supplier
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Supplier *</Label>
                                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Expected Delivery</Label>
                                        <Input
                                            type="date"
                                            value={expectedDate}
                                            onChange={(e) => setExpectedDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Add Products</CardTitle>
                                <CardDescription>Search and add products to the order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {products.slice(0, 10).map(product => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                                            onClick={() => addItem(product)}
                                        >
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-gray-500">{product.sku} • Stock: {product.stockQty}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">LKR {Number(product.costPrice).toLocaleString()}</span>
                                                <Button type="button" size="sm" variant="ghost">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Items</CardTitle>
                                <CardDescription>{items.length} items in order</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {items.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No items added yet</p>
                                        <p className="text-sm">Search and add products above</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="text-right">Unit Price</TableHead>
                                                <TableHead className="text-center">Quantity</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map(item => (
                                                <TableRow key={item.productId}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium">{item.productName}</p>
                                                            <p className="text-sm text-gray-500">{item.productSku}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        LKR {item.unitPrice.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                            className="w-20 text-center mx-auto"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        LKR {item.lineTotal.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600"
                                                            onClick={() => removeItem(item.productId)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Summary */}
                    <div>
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Items</span>
                                        <span>{items.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>LKR {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>LKR {subtotal.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Add notes..."
                                        className="w-full h-24 px-3 py-2 border rounded-md text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={loading || !selectedSupplier || items.length === 0}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Create Order
                                            </>
                                        )}
                                    </Button>
                                    <Link href="/spareparts/purchases" className="block">
                                        <Button type="button" variant="outline" className="w-full">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
}
