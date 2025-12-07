
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, CreditCard } from 'lucide-react';
import Link from 'next/link';

// Mock Data
const INITIAL_CART = [
    { id: 1, name: 'Ergonomic Office Chair', price: 299.00, quantity: 2, image: '🪑' },
    { id: 2, name: 'Wireless Mechanical Keyboard', price: 149.50, quantity: 1, image: '⌨️' },
    { id: 3, name: '27" 4K Monitor', price: 499.99, quantity: 1, image: '🖥️' },
];

export default function CartPage() {
    const [cart, setCart] = useState(INITIAL_CART);

    const updateQuantity = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shopping Cart</h1>
                    <p className="text-slate-500">Review your items and proceed to checkout</p>
                </div>
                <Badge variant="outline" className="text-sm py-1 px-3 border-blue-200 bg-blue-50 text-blue-700">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
                </Badge>
            </div>

            {cart.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="h-10 w-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Your cart is empty</h2>
                        <p className="text-slate-500 mb-8 max-w-md">
                            Looks like you haven't added anything to your cart yet.
                            Browse our catalog to find products and services.
                        </p>
                        <Link href="/sales">
                            <Button size="lg">Continue Shopping</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <Card key={item.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="w-full sm:w-32 h-32 bg-slate-100 flex items-center justify-center text-4xl">
                                            {item.image}
                                        </div>
                                        <div className="flex-1 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <h3 className="font-semibold text-lg text-slate-900">{item.name}</h3>
                                                <p className="text-slate-500 text-sm">In Stock</p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center border rounded-lg">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="p-2 hover:bg-slate-50 text-slate-600"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <span className="w-10 text-center font-medium">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="p-2 hover:bg-slate-50 text-slate-600"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="text-right min-w-[80px]">
                                                    <div className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</div>
                                                    <div className="text-xs text-slate-500">${item.price.toFixed(2)} each</div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 shadow-lg border-slate-200">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Tax (10%)</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>

                                <div className="h-px bg-slate-200 my-2" />

                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-bold text-slate-900">Total</span>
                                    <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <div className="relative">
                                        <Input placeholder="Discount code" className="pr-20" />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="absolute right-1 top-1 h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
                                <Button className="w-full h-12 text-lg gap-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
                                    Checkout <ArrowRight className="h-5 w-5" />
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
                            <CreditCard className="h-4 w-4" />
                            <span>Secure Checkout</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
