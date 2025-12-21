"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, FlaskConical, Clock, CheckCircle, TestTube, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
}

interface LabTest {
    id: string;
    code: string;
    name: string;
    category: string;
    price: number;
}

interface Visit {
    id: string;
    visitNumber: number;
    patient: Patient;
}

interface LabOrder {
    id: string;
    orderNumber: string;
    status: string;
    priority: string;
    isPaid: boolean;
    createdAt: string;
    labTest: LabTest;
    visit: Visit;
}

export default function LaboratoryPage() {
    const router = useRouter();
    const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    const fetchLabOrders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/healthcare/lab-orders');
            if (res.ok) {
                const data = await res.json();
                setLabOrders(data.labOrders || data || []);
            }
        } catch (error) {
            console.error('Error fetching lab orders:', error);
            toast.error('Failed to load lab orders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLabOrders();
    }, [fetchLabOrders]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'SAMPLE_COLLECTED':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sample Collected</Badge>;
            case 'PROCESSING':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Processing</Badge>;
            case 'COMPLETED':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
            case 'CANCELLED':
                return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return <Badge className="bg-red-500">URGENT</Badge>;
            case 'STAT':
                return <Badge className="bg-orange-500">STAT</Badge>;
            default:
                return null;
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/healthcare/lab-orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error('Failed to update');
            toast.success(`Status updated to ${newStatus}`);
            fetchLabOrders();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const pendingOrders = labOrders.filter(o => o.status === 'PENDING');
    const inProgressOrders = labOrders.filter(o => o.status === 'SAMPLE_COLLECTED' || o.status === 'PROCESSING');
    const completedOrders = labOrders.filter(o => o.status === 'COMPLETED');

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Laboratory</h1>
                    <p className="text-gray-600">Manage lab orders and results</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/healthcare/lab/tests')}>
                        <TestTube className="mr-2 h-4 w-4" /> Manage Tests
                    </Button>
                    <Button variant="outline" onClick={fetchLabOrders}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending</p>
                            <p className="mt-1 text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
                        </div>
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">In Progress</p>
                            <p className="mt-1 text-3xl font-bold text-blue-600">{inProgressOrders.length}</p>
                        </div>
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                            <FlaskConical className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Completed</p>
                            <p className="mt-1 text-3xl font-bold text-green-600">{completedOrders.length}</p>
                        </div>
                        <div className="rounded-xl bg-green-100 p-3 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Today</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{labOrders.length}</p>
                        </div>
                        <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
                            <FileText className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="pending" className="gap-2">
                        <Clock className="h-4 w-4" /> Pending ({pendingOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="in-progress" className="gap-2">
                        <FlaskConical className="h-4 w-4" /> In Progress ({inProgressOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2">
                        <CheckCircle className="h-4 w-4" /> Completed ({completedOrders.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Lab Orders</CardTitle>
                            <CardDescription>Tests waiting for sample collection</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>
                            ) : pendingOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <FlaskConical className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No pending lab orders</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingOrders.map((order) => (
                                        <LabOrderCard
                                            key={order.id}
                                            order={order}
                                            getStatusBadge={getStatusBadge}
                                            getPriorityBadge={getPriorityBadge}
                                            onAction={() => handleUpdateStatus(order.id, 'SAMPLE_COLLECTED')}
                                            actionLabel="Collect Sample"
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="in-progress">
                    <Card>
                        <CardHeader>
                            <CardTitle>In Progress</CardTitle>
                            <CardDescription>Tests being processed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {inProgressOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <FlaskConical className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No tests in progress</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {inProgressOrders.map((order) => (
                                        <LabOrderCard
                                            key={order.id}
                                            order={order}
                                            getStatusBadge={getStatusBadge}
                                            getPriorityBadge={getPriorityBadge}
                                            onAction={() => router.push(`/healthcare/lab/${order.id}`)}
                                            actionLabel="Enter Results"
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed">
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed</CardTitle>
                            <CardDescription>Tests with results entered</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {completedOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No completed tests</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {completedOrders.map((order) => (
                                        <LabOrderCard
                                            key={order.id}
                                            order={order}
                                            getStatusBadge={getStatusBadge}
                                            getPriorityBadge={getPriorityBadge}
                                            onAction={() => router.push(`/healthcare/lab/${order.id}`)}
                                            actionLabel="View Results"
                                            actionVariant="outline"
                                        />
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

function LabOrderCard({
    order,
    getStatusBadge,
    getPriorityBadge,
    onAction,
    actionLabel,
    actionVariant = 'default',
}: {
    order: LabOrder;
    getStatusBadge: (status: string) => React.ReactNode;
    getPriorityBadge: (priority: string) => React.ReactNode | null;
    onAction: () => void;
    actionLabel: string;
    actionVariant?: 'default' | 'outline';
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <FlaskConical className="h-6 w-6" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{order.labTest.name}</p>
                        {getPriorityBadge(order.priority)}
                    </div>
                    <p className="text-sm text-gray-500">
                        {order.orderNumber} • {order.labTest.code} • Rs.{order.labTest.price}
                    </p>
                    <p className="text-sm text-gray-600">
                        Token #{order.visit.visitNumber} - {order.visit.patient.firstName} {order.visit.patient.lastName}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {getStatusBadge(order.status)}
                {!order.isPaid && <Badge variant="outline" className="text-red-600 border-red-200">Unpaid</Badge>}
                <Button variant={actionVariant} onClick={onAction}>
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
}
