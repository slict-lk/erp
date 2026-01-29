"use client";

import { useCallback, useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    Gavel,
    Ship,
    ClipboardCheck,
    Camera,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    RefreshCw,
    Plus,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Vehicle {
    id: string;
    stockNumber: string;
    chassisNumber: string;
    make: string;
    model: string;
    year: number;
    month: number | null;
    engineCode: string | null;
    engineCc: number | null;
    fuelType: string | null;
    color: string | null;
    transmission: string | null;
    mileage: number | null;
    location: string | null;
    purchasePrice: number;
    fobPrice: number | null;
    cifPrice: number | null;
    taxAmount: number | null;
    dutyAmount: number | null;
    shippingCost: number | null;
    auctionHouse: string | null;
    auctionGrade: string | null;
    lotNumber: string | null;
    status: string;
    shakenStatus: string;
    mashoStatus: string;
    jaaiStatus: string;
    isPublished: boolean;
    customer: { id: string; name: string; email: string; country: string | null } | null;
    shipment: { id: string; shipmentNumber: string; vesselName: string | null; status: string } | null;
    photos: { id: string; url: string; tag: string | null }[];
    yardJobs: YardJob[];
    bids: { id: string; status: string; maxBudget: number | null; customer: { name: string } }[];
    documentDispatch: { id: string; status: string; courierName: string | null; trackingNumber: string | null; dispatchedAt: string | null } | null;
    exportInvoice: { id: string; invoiceNumber: string; totalAmount: number; status: string } | null;
}


interface YardJob {
    id: string;
    title: string;
    type: string;
    status: string;
    notes: string | null;
    assignedTo: string | null;
    completedAt: string | null;
    proofPhotos: string[];
    createdAt: string;
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

const COMPLIANCE_COLORS: Record<string, string> = {
    NOT_STARTED: 'text-gray-400',
    IN_PROGRESS: 'text-yellow-500',
    PASSED: 'text-green-500',
    FAILED: 'text-red-500',
    RECEIVED: 'text-green-500',
    NOT_APPLICABLE: 'text-gray-400',
};

function formatCurrency(amount: number | null, currency: string = 'JPY'): string {
    if (amount === null) return '—';
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { toast } = useToast();

    const fetchVehicle = useCallback(async () => {
        try {
            const res = await fetch(`/api/vehicle-export/vehicles/${id}`);
            if (res.ok) {
                const data = await res.json();
                setVehicle(data.vehicle);
            }
        } catch (error) {
            console.error('Error fetching vehicle:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchVehicle();
    }, [fetchVehicle]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/vehicle-export/vehicles/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast({ title: 'Status Updated', description: `Vehicle status changed to ${STATUS_LABELS[newStatus]}` });
                fetchVehicle();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Vehicle not found</p>
                <Link href="/vehicle-export/inventory">
                    <Button className="mt-4">Back to Inventory</Button>
                </Link>
            </div>
        );
    }

    // Count completed jobs
    const completedJobs = vehicle.yardJobs.filter(j => j.status === 'DONE').length;
    const totalJobs = vehicle.yardJobs.length;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                    <Link href="/vehicle-export/inventory">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <p className="text-sm text-gray-500 font-mono">{vehicle.stockNumber}</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                        </h1>
                        <p className="text-gray-500">{vehicle.chassisNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`${STATUS_COLORS[vehicle.status]} text-sm px-3 py-1`}>
                        {STATUS_LABELS[vehicle.status] || vehicle.status}
                    </Badge>
                    <Select value={vehicle.status} onValueChange={updateStatus} disabled={updating}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Change Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="WON_AT_AUCTION">Won at Auction</SelectItem>
                            <SelectItem value="IN_YARD">In Yard</SelectItem>
                            <SelectItem value="READY_TO_SHIP">Ready to Ship</SelectItem>
                            <SelectItem value="SHIPPED">Shipped</SelectItem>
                            <SelectItem value="DELIVERED">Delivered</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Gavel className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                        <p className="text-sm text-gray-500">Purchase</p>
                        <p className="font-bold">{formatCurrency(vehicle.purchasePrice)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Ship className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm text-gray-500">FOB Price</p>
                        <p className="font-bold">{formatCurrency(vehicle.fobPrice)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-gray-500">Yard Jobs</p>
                        <p className="font-bold">{completedJobs}/{totalJobs}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Camera className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <p className="text-sm text-gray-500">Photos</p>
                        <p className="font-bold">{vehicle.photos.length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="yard">Yard Jobs</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Specifications</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-3">
                                    {[
                                        ['Make', vehicle.make],
                                        ['Model', vehicle.model],
                                        ['Year/Month', `${vehicle.year}/${vehicle.month || '—'}`],
                                        ['Color', vehicle.color],
                                        ['Transmission', vehicle.transmission],
                                        ['Fuel Type', vehicle.fuelType],
                                        ['Engine', `${vehicle.engineCode || '—'} (${vehicle.engineCc || '—'} cc)`],
                                        ['Mileage', vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—'],
                                        ['Auction Grade', vehicle.auctionGrade],
                                        ['Location', vehicle.location],
                                    ].map(([label, value]) => (
                                        <div key={label as string} className="flex justify-between">
                                            <dt className="text-gray-500">{label}</dt>
                                            <dd className="font-medium">{value || '—'}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Customer & Shipment</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {vehicle.customer ? (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">{vehicle.customer.name}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">{vehicle.customer.email}</p>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {vehicle.customer.country || 'Unknown'}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">No customer assigned</p>
                                )}

                                {vehicle.shipment ? (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Ship className="h-4 w-4 text-blue-500" />
                                            <span className="font-medium">{vehicle.shipment.shipmentNumber}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {vehicle.shipment.vesselName || 'Vessel TBD'}
                                        </p>
                                        <Badge className="mt-2" variant="secondary">
                                            {vehicle.shipment.status}
                                        </Badge>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">Not assigned to shipment</p>
                                )}

                                {/* Document Dispatch Section (Phase 5) */}
                                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-purple-500" />
                                            <span className="font-medium">Documents</span>
                                        </div>
                                        {vehicle.documentDispatch && (
                                            <Badge variant="outline">{vehicle.documentDispatch.status}</Badge>
                                        )}
                                    </div>

                                    {vehicle.documentDispatch ? (
                                        <div className="text-sm space-y-1">
                                            <p className="text-gray-600 dark:text-gray-400">
                                                {vehicle.documentDispatch.courierName || 'Unknown Courier'}
                                            </p>
                                            <p className="font-mono text-gray-900 dark:text-gray-100">
                                                {vehicle.documentDispatch.trackingNumber || 'No Tracking #'}
                                            </p>
                                            {vehicle.documentDispatch.dispatchedAt && (
                                                <p className="text-xs text-gray-500">
                                                    Sent: {new Date(vehicle.documentDispatch.dispatchedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 mb-2">No dispatch details</p>
                                    )}

                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full mt-2"
                                        onClick={() => {
                                            // TODO: Open Dialog to Edit Dispatch
                                            toast({ title: "Coming Soon", description: "Dispatch editing dialog to be implemented" });
                                        }}
                                    >
                                        {vehicle.documentDispatch ? 'Update Tracking' : 'Dispatch Documents'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Compliance Tab */}
                <TabsContent value="compliance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance Checklist</CardTitle>
                            <CardDescription>Required certifications for export</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { key: 'shakenStatus', label: 'Shaken (Vehicle Inspection)', icon: CheckCircle },
                                    { key: 'mashoStatus', label: 'Masho (Export Certificate)', icon: Ship },
                                    { key: 'jaaiStatus', label: 'JAAI (Pre-shipment Inspection)', icon: ClipboardCheck },
                                ].map(({ key, label, icon: Icon }) => {
                                    const status = vehicle[key as keyof Vehicle] as string;
                                    return (
                                        <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Icon className={`h-5 w-5 ${COMPLIANCE_COLORS[status]}`} />
                                                <span className="font-medium">{label}</span>
                                            </div>
                                            <Badge variant={status === 'PASSED' || status === 'RECEIVED' ? 'default' : 'secondary'}>
                                                {status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Compliance Warning */}
                            {vehicle.customer?.country === 'Sri Lanka' && vehicle.jaaiStatus !== 'PASSED' && (
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-medium">JAAI Required for Sri Lanka</span>
                                    </div>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                                        This vehicle cannot be shipped to Sri Lanka until JAAI inspection is passed.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Yard Jobs Tab */}
                <TabsContent value="yard">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Yard Jobs</CardTitle>
                                <CardDescription>Repairs and inspections</CardDescription>
                            </div>
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Job
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {vehicle.yardJobs.length === 0 ? (
                                <p className="text-center py-8 text-gray-400">No yard jobs</p>
                            ) : (
                                <div className="space-y-3">
                                    {vehicle.yardJobs.map((job) => (
                                        <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {job.status === 'DONE' ? (
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                ) : job.status === 'IN_PROGRESS' ? (
                                                    <Clock className="h-5 w-5 text-yellow-500" />
                                                ) : (
                                                    <Clock className="h-5 w-5 text-gray-400" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{job.title}</p>
                                                    <p className="text-sm text-gray-500">{job.type} • {job.assignedTo || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                            <Badge variant={job.status === 'DONE' ? 'default' : 'secondary'}>
                                                {job.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financials Tab */}
                <TabsContent value="financials">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Summary</CardTitle>
                            <CardDescription>Costs and pricing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-500">Purchase Price</p>
                                        <p className="text-2xl font-bold">{formatCurrency(vehicle.purchasePrice)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-500">FOB Price</p>
                                        <p className="text-2xl font-bold">{formatCurrency(vehicle.fobPrice)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-500">CIF Price</p>
                                        <p className="text-2xl font-bold">{formatCurrency(vehicle.cifPrice)}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm text-gray-500">Export Invoice</p>
                                        {vehicle.exportInvoice && (
                                            <Badge variant={vehicle.exportInvoice.status === 'PAID' ? 'default' : 'secondary'}>
                                                {vehicle.exportInvoice.status}
                                            </Badge>
                                        )}
                                    </div>
                                    {vehicle.exportInvoice ? (
                                        <div>
                                            <p className="text-2xl font-bold">{formatCurrency(vehicle.exportInvoice.totalAmount)}</p>
                                            <p className="text-sm text-gray-500 font-mono mb-2">{vehicle.exportInvoice.invoiceNumber}</p>
                                            <Button size="sm" variant="outline" className="w-full">
                                                View Invoice
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-2xl font-bold text-gray-300">—</p>
                                            <Button
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/vehicle-export/vehicles/${vehicle.id}/invoice`);
                                                        if (res.ok) {
                                                            toast({ title: 'Invoice Generated', description: 'Draft invoice created successfully.' });
                                                            fetchVehicle();
                                                        }
                                                    } catch (e) {
                                                        toast({ title: 'Error', description: 'Failed to generate invoice', variant: 'destructive' });
                                                    }
                                                }}
                                            >
                                                Generate Invoice
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Tax Amount</p>
                                            <p className="font-medium">{formatCurrency(vehicle.taxAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Duty Amount</p>
                                            <p className="font-medium">{formatCurrency(vehicle.dutyAmount)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}
