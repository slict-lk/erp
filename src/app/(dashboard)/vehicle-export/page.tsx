"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Ship,
    Gavel,
    Users,
    Package,
    ClipboardCheck,
    Truck,
    AlertTriangle,
    RefreshCw,
    Plus,
    ArrowRight,
    Clock,
    CheckCircle,
    CircleDot,
} from 'lucide-react';

interface DashboardStats {
    pendingBids: number;
    approvedBids: number;
    inYard: number;
    readyToShip: number;
    shipped: number;
    delivered: number;
    pendingYardJobs: number;
    totalVehicles: number;
}

interface RecentVehicle {
    id: string;
    stockNumber: string;
    make: string;
    model: string;
    status: string;
    updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
    WON_AT_AUCTION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    IN_YARD: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    READY_TO_SHIP: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    DELIVERED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const STATUS_LABELS: Record<string, string> = {
    WON_AT_AUCTION: 'Won at Auction',
    IN_YARD: 'In Yard',
    READY_TO_SHIP: 'Ready to Ship',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
};

export default function VehicleExportPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentVehicles, setRecentVehicles] = useState<RecentVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch('/api/vehicle-export/dashboard');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setRecentVehicles(data.recentVehicles || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <Ship className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Vehicle Export
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        End-to-end vehicle export management - Bid to Delivery
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={fetchData} disabled={refreshing} className="w-full sm:w-auto">
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/vehicle-export/auction/new" className="w-full sm:w-auto">
                        <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Auction Win
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
                <StatCard
                    title="Pending Bids"
                    value={stats?.pendingBids ?? 0}
                    subtitle="Awaiting approval"
                    icon={Clock}
                    variant="yellow"
                />
                <StatCard
                    title="In Yard"
                    value={stats?.inYard ?? 0}
                    subtitle="Repairs/Inspection"
                    icon={Package}
                    variant="blue"
                />
                <StatCard
                    title="Ready to Ship"
                    value={stats?.readyToShip ?? 0}
                    subtitle="Compliance complete"
                    icon={CheckCircle}
                    variant="green"
                />
                <StatCard
                    title="Shipped"
                    value={stats?.shipped ?? 0}
                    subtitle="In transit"
                    icon={Truck}
                    variant="purple"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                <QuickAction href="/vehicle-export/bids" icon={Users} label="Manage Bids" color="bg-yellow-500" />
                <QuickAction href="/vehicle-export/auction/new" icon={Gavel} label="Auction Entry" color="bg-orange-500" />
                <QuickAction href="/vehicle-export/inventory" icon={Package} label="Inventory" color="bg-blue-500" />
                <QuickAction href="/vehicle-export/yard" icon={ClipboardCheck} label="Yard Jobs" color="bg-green-500" />
                <QuickAction href="/vehicle-export/shipments" icon={Ship} label="Shipments" color="bg-purple-500" />
                <QuickAction href="/vehicle-export/customers" icon={Users} label="Customers" color="bg-teal-500" />
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Vehicles */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest vehicle updates</CardDescription>
                        </div>
                        <Link href="/vehicle-export/inventory">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-gray-500">
                                Loading...
                            </div>
                        ) : recentVehicles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <Ship className="h-12 w-12 mb-2 opacity-50" />
                                <p>No vehicles yet</p>
                                <Link href="/vehicle-export/auction/new" className="mt-2">
                                    <Button size="sm">Add First Vehicle</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentVehicles.map((vehicle) => (
                                    <Link key={vehicle.id} href={`/vehicle-export/inventory/${vehicle.id}`}>
                                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {vehicle.stockNumber}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {vehicle.make} {vehicle.model}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={STATUS_COLORS[vehicle.status] || ''}>
                                                {STATUS_LABELS[vehicle.status] || vehicle.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Alerts & Tasks</CardTitle>
                        <CardDescription>Items requiring attention</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats && stats.pendingBids > 0 && (
                                <AlertItem
                                    type="warning"
                                    title="Pending Bids"
                                    description={`${stats.pendingBids} bids waiting for approval`}
                                    action={{ label: 'Review', href: '/vehicle-export/bids?status=PENDING' }}
                                />
                            )}
                            {stats && stats.pendingYardJobs > 0 && (
                                <AlertItem
                                    type="info"
                                    title="Yard Jobs"
                                    description={`${stats.pendingYardJobs} repair/inspection tasks pending`}
                                    action={{ label: 'View', href: '/vehicle-export/yard' }}
                                />
                            )}
                            {stats && stats.readyToShip > 0 && (
                                <AlertItem
                                    type="success"
                                    title="Ready to Ship"
                                    description={`${stats.readyToShip} vehicles ready for shipment assignment`}
                                    action={{ label: 'Assign', href: '/vehicle-export/shipments' }}
                                />
                            )}
                            {(!stats || (stats.pendingBids === 0 && stats.pendingYardJobs === 0 && stats.readyToShip === 0)) && (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mb-2 opacity-50" />
                                    <p>All caught up!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workflow Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Workflow Pipeline</CardTitle>
                    <CardDescription>Vehicle count at each stage</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2 items-center justify-center">
                        <PipelineStep label="Bids" count={stats?.pendingBids ?? 0} color="yellow" />
                        <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                        <PipelineStep label="Auction" count={stats?.approvedBids ?? 0} color="orange" />
                        <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                        <PipelineStep label="Yard" count={stats?.inYard ?? 0} color="blue" />
                        <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                        <PipelineStep label="Ready" count={stats?.readyToShip ?? 0} color="green" />
                        <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                        <PipelineStep label="Shipped" count={stats?.shipped ?? 0} color="purple" />
                        <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                        <PipelineStep label="Delivered" count={stats?.delivered ?? 0} color="gray" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    variant,
}: {
    title: string;
    value: number;
    subtitle: string;
    icon: typeof Clock;
    variant: 'yellow' | 'blue' | 'green' | 'purple';
}) {
    const colors = {
        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    };

    return (
        <Card>
            <CardContent className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <div className={`rounded-xl p-2 sm:p-3 flex-shrink-0 ${colors[variant]}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function QuickAction({
    href,
    icon: Icon,
    label,
    color,
}: {
    href: string;
    icon: typeof Clock;
    label: string;
    color: string;
}) {
    return (
        <Link href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 text-center min-h-[100px] sm:min-h-[120px]">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center mb-2`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
                </CardContent>
            </Card>
        </Link>
    );
}

function AlertItem({
    type,
    title,
    description,
    action,
}: {
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    action?: { label: string; href: string };
}) {
    const colors = {
        warning: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
        info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    };

    const icons = {
        warning: AlertTriangle,
        info: CircleDot,
        success: CheckCircle,
    };

    const Icon = icons[type];

    return (
        <div className={`flex items-center justify-between p-4 rounded-lg border ${colors[type]}`}>
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm opacity-80">{description}</p>
                </div>
            </div>
            {action && (
                <Link href={action.href}>
                    <Button variant="ghost" size="sm">
                        {action.label}
                    </Button>
                </Link>
            )}
        </div>
    );
}

function PipelineStep({
    label,
    count,
    color,
}: {
    label: string;
    count: number;
    color: 'yellow' | 'orange' | 'blue' | 'green' | 'purple' | 'gray';
}) {
    const colors = {
        yellow: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700',
        orange: 'bg-orange-100 border-orange-300 dark:bg-orange-900 dark:border-orange-700',
        blue: 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700',
        green: 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700',
        purple: 'bg-purple-100 border-purple-300 dark:bg-purple-900 dark:border-purple-700',
        gray: 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
    };

    return (
        <div className={`flex flex-col items-center p-3 rounded-lg border-2 ${colors[color]} min-w-[80px]`}>
            <span className="text-2xl font-bold">{count}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
        </div>
    );
}
