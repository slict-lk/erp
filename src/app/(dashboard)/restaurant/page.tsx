'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, CreditCard, LayoutGrid, Settings, UtensilsCrossed, Users, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react';

export default function RestaurantDashboard() {
    const stats = [
        { label: 'Live Occupancy', value: '64%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Orders', value: '12', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Kitchen Load', value: 'High', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Daily Sales', value: 'Rs. 45k', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const modules = [
        {
            title: 'Point of Sale (POS)',
            description: 'Take orders for Dine-in, Takeaway, and Delivery.',
            icon: CreditCard,
            href: '/restaurant/pos',
            color: 'bg-blue-600',
        },
        {
            title: 'Kitchen Display (KDS)',
            description: 'Real-time order tickets for the kitchen team.',
            icon: ChefHat,
            href: '/restaurant/kitchen',
            color: 'bg-orange-600',
        },
        {
            title: 'Floor Plan',
            description: 'Manage table layout and zones (A/C, Outdoor).',
            icon: LayoutGrid,
            href: '/restaurant/floor-plan',
            color: 'bg-indigo-600',
        },
        {
            title: 'Menu & Settings',
            description: 'Configure menu items, taxes, and preferences.',
            icon: Settings,
            href: '/restaurant/setup',
            color: 'bg-slate-600',
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Restaurant Operations</h1>
                    <p className="text-slate-500 mt-2">Manage your front and back of house operations.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    Restauarant Open
                </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Modules Grid */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Core Modules
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((module, i) => (
                        <Link key={i} href={module.href} className="group">
                            <Card className="h-full border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
                                <div className={`absolute top-0 left-0 w-1 h-full ${module.color}`}></div>
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${module.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                                        <module.icon className={`h-6 w-6 ${module.color.replace('bg-', 'text-')}`} />
                                    </div>
                                    <CardTitle className="text-lg group-hover:text-blue-700 transition-colors flex items-center justify-between">
                                        {module.title}
                                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                                    </CardTitle>
                                    <CardDescription className="pt-2">
                                        {module.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Activity / Quick Actions (Placeholder for now) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-slate-200">
                    <CardHeader>
                        <CardTitle>Live Kitchen Status</CardTitle>
                        <CardDescription>Current active orders in preparation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                                            #{8820 + i}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Table {4 + i} • Dine-in</h4>
                                            <p className="text-sm text-slate-500">3 items • Waiting 12m</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">View Ticket</Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader>
                        <CardTitle>Shift Manager</CardTitle>
                        <CardDescription>Staff on duty: 4</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm font-medium flex justify-between items-center">
                            <span>Captain Perera (POS)</span>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                        <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm font-medium flex justify-between items-center">
                            <span>Chef Silva (Grill)</span>
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        </div>
                        <Button className="w-full mt-4" variant="outline">Manage Shift</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}