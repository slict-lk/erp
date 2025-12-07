'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Calendar, User } from 'lucide-react';

interface PurchaseOrder {
    id: string;
    poNumber: string;
    vendor: string;
    items: number;
    totalAmount: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED';
    orderDate: string;
}

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/inventory/purchase-orders');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            }
        };
        fetchOrders();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
                    <p className="text-gray-600">Manage inventory purchase orders</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New PO
                </Button>
            </div>

            <div className="grid gap-4">
                {orders.map((order) => (
                    <Card key={order.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                        <ShoppingCart className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{order.poNumber}</h3>
                                            <Badge>{order.status}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {order.vendor}
                                            </span>
                                            <span>{order.items} items</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(order.orderDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
