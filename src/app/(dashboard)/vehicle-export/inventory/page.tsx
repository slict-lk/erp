"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Package, Search, RefreshCw, Plus, Eye, MapPin, User } from 'lucide-react';

interface Vehicle {
    id: string;
    stockNumber: string;
    chassisNumber: string;
    make: string;
    model: string;
    year: number;
    color: string | null;
    mileage: number | null;
    status: string;
    purchasePrice: number;
    location: string | null;
    customer: { id: string; name: string; country: string | null } | null;
    photos: { url: string }[];
    _count: { yardJobs: number; bids: number };
}

const STATUS_COLORS: Record<string, string> = {
    WON_AT_AUCTION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    IN_YARD: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    READY_TO_SHIP: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    DELIVERED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
    WON_AT_AUCTION: 'Won at Auction',
    IN_YARD: 'In Yard',
    READY_TO_SHIP: 'Ready to Ship',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function InventoryPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchVehicles = useCallback(async () => {
        try {
            setRefreshing(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (search) params.set('search', search);

            const res = await fetch(`/api/vehicle-export/vehicles?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setVehicles(data.vehicles || []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, search]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchVehicles();
        }, 300);
        return () => clearTimeout(debounce);
    }, [fetchVehicles]);

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Vehicle Inventory
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        All export vehicles and their status
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={fetchVehicles} disabled={refreshing} className="w-full sm:w-auto">
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/vehicle-export/auction/new" className="w-full sm:w-auto">
                        <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Vehicle
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3">
                {['all', 'WON_AT_AUCTION', 'IN_YARD', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED'].map((status) => {
                    const count = status === 'all'
                        ? vehicles.length
                        : vehicles.filter(v => v.status === status).length;
                    return (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                            className="h-8"
                        >
                            {status === 'all' ? 'All' : STATUS_LABELS[status] || status}
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                                {count}
                            </Badge>
                        </Button>
                    );
                })}
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by stock#, chassis#, make, model..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Vehicles List */}
            <Card>
                <CardHeader>
                    <CardTitle>Vehicles</CardTitle>
                    <CardDescription>{vehicles.length} vehicles found</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            Loading vehicles...
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Package className="h-12 w-12 mb-2 opacity-50" />
                            <p>No vehicles found</p>
                            <Link href="/vehicle-export/auction/new" className="mt-4">
                                <Button>Add First Vehicle</Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Stock #</TableHead>
                                            <TableHead>Vehicle</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vehicles.map((vehicle) => (
                                            <TableRow key={vehicle.id}>
                                                <TableCell className="font-mono font-medium">
                                                    {vehicle.stockNumber}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {vehicle.year} • {vehicle.color} • {vehicle.mileage?.toLocaleString() || '—'} km
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {vehicle.customer ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <User className="h-3 w-3 text-gray-400" />
                                                            {vehicle.customer.name}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {vehicle.location ? (
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <MapPin className="h-3 w-3 text-gray-400" />
                                                            {vehicle.location}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(vehicle.purchasePrice)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_COLORS[vehicle.status] || ''}>
                                                        {STATUS_LABELS[vehicle.status] || vehicle.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/vehicle-export/inventory/${vehicle.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile/Tablet Cards */}
                            <div className="lg:hidden space-y-3">
                                {vehicles.map((vehicle) => (
                                    <Link key={vehicle.id} href={`/vehicle-export/inventory/${vehicle.id}`}>
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-mono text-sm text-gray-500">{vehicle.stockNumber}</p>
                                                        <p className="font-semibold text-lg">{vehicle.make} {vehicle.model}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {vehicle.year} • {vehicle.color || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <Badge className={STATUS_COLORS[vehicle.status] || ''}>
                                                        {STATUS_LABELS[vehicle.status] || vehicle.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center pt-3 border-t">
                                                    <div>
                                                        {vehicle.customer ? (
                                                            <p className="text-sm flex items-center gap-1">
                                                                <User className="h-3 w-3 text-gray-400" />
                                                                {vehicle.customer.name}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400">No customer</p>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold">{formatCurrency(vehicle.purchasePrice)}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
