"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Ship, RefreshCw, Plus, Package, Anchor, Truck, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Vehicle {
    id: string;
    stockNumber: string;
    make: string;
    model: string;
    status: string;
}

interface Shipment {
    id: string;
    shipmentNumber: string;
    vesselName: string | null;
    voyageNumber: string | null;
    shippingLine: string | null;
    departurePort: string;
    destinationPort: string;
    etd: string | null;
    eta: string | null;
    status: string;
    vehicles: Vehicle[];
    _count: { vehicles: number };
}

const STATUS_COLORS: Record<string, string> = {
    BOOKED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    LOADING: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const PORTS = {
    departure: ['Yokohama', 'Nagoya', 'Kobe', 'Osaka', 'Hakata', 'Kawasaki'],
    destination: ['Colombo', 'Gaborone', 'Durban', 'Mombasa', 'Dar es Salaam', 'Lagos', 'Tema'],
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(dateStr));
}

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
    const [readyVehicles, setReadyVehicles] = useState<Vehicle[]>([]);
    const { toast } = useToast();

    const [newShipment, setNewShipment] = useState({
        vesselName: '',
        voyageNumber: '',
        shippingLine: '',
        departurePort: 'Yokohama',
        destinationPort: 'Colombo',
        etd: '',
        eta: '',
    });

    const fetchShipments = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch('/api/vehicle-export/shipments');
            if (res.ok) {
                const data = await res.json();
                setShipments(data.shipments || []);
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchReadyVehicles = useCallback(async () => {
        try {
            const res = await fetch('/api/vehicle-export/vehicles?status=READY_TO_SHIP');
            if (res.ok) {
                const data = await res.json();
                setReadyVehicles(data.vehicles || []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    }, []);

    useEffect(() => {
        fetchShipments();
        fetchReadyVehicles();
    }, [fetchShipments, fetchReadyVehicles]);

    const handleCreate = async () => {
        if (!newShipment.departurePort || !newShipment.destinationPort) {
            toast({ title: 'Error', description: 'Please select ports', variant: 'destructive' });
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/vehicle-export/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newShipment),
            });

            if (res.ok) {
                toast({ title: 'Shipment Created', description: 'New shipment has been created' });
                setShowCreateDialog(false);
                setNewShipment({
                    vesselName: '',
                    voyageNumber: '',
                    shippingLine: '',
                    departurePort: 'Yokohama',
                    destinationPort: 'Colombo',
                    etd: '',
                    eta: '',
                });
                fetchShipments();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create shipment', variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    };

    const handleShip = async (shipmentId: string) => {
        try {
            const res = await fetch('/api/vehicle-export/shipments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shipmentId, action: 'ship' }),
            });

            if (res.ok) {
                toast({ title: 'Shipment Marked as Shipped' });
                fetchShipments();
                setSelectedShipment(null);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update shipment', variant: 'destructive' });
        }
    };

    const handleDeliver = async (shipmentId: string) => {
        try {
            const res = await fetch('/api/vehicle-export/shipments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shipmentId, action: 'deliver' }),
            });

            if (res.ok) {
                toast({ title: 'Shipment Marked as Delivered' });
                fetchShipments();
                setSelectedShipment(null);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update shipment', variant: 'destructive' });
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <Ship className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Shipments
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Manage vessel bookings and vehicle assignments
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchShipments} disabled={refreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Shipment
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
                        <p className="text-sm text-gray-500">Ready to Ship</p>
                        <p className="text-2xl font-bold">{readyVehicles.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Anchor className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-gray-500">Booked</p>
                        <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'BOOKED').length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Ship className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                        <p className="text-sm text-gray-500">In Transit</p>
                        <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'SHIPPED').length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">Delivered</p>
                        <p className="text-2xl font-bold">{shipments.filter(s => s.status === 'DELIVERED').length}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Shipments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Shipments</CardTitle>
                    <CardDescription>{shipments.length} shipments</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            Loading shipments...
                        </div>
                    ) : shipments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Ship className="h-12 w-12 mb-2 opacity-50" />
                            <p>No shipments yet</p>
                            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                                Create First Shipment
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Shipment #</TableHead>
                                            <TableHead>Vessel</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead>ETD</TableHead>
                                            <TableHead>Vehicles</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shipments.map((shipment) => (
                                            <TableRow key={shipment.id}>
                                                <TableCell className="font-mono font-medium">
                                                    {shipment.shipmentNumber}
                                                </TableCell>
                                                <TableCell>
                                                    {shipment.vesselName || <span className="text-gray-400">TBD</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {shipment.departurePort} → {shipment.destinationPort}
                                                </TableCell>
                                                <TableCell>{formatDate(shipment.etd)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{shipment._count.vehicles}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_COLORS[shipment.status]}>
                                                        {shipment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedShipment(shipment)}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile */}
                            <div className="md:hidden space-y-3">
                                {shipments.map((shipment) => (
                                    <Card
                                        key={shipment.id}
                                        className="cursor-pointer hover:shadow-md"
                                        onClick={() => setSelectedShipment(shipment)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="font-mono font-medium">{shipment.shipmentNumber}</p>
                                                <Badge className={STATUS_COLORS[shipment.status]}>
                                                    {shipment.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {shipment.departurePort} → {shipment.destinationPort}
                                            </p>
                                            <div className="flex justify-between mt-3 pt-3 border-t">
                                                <span className="text-sm">ETD: {formatDate(shipment.etd)}</span>
                                                <Badge variant="secondary">{shipment._count.vehicles} vehicles</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Shipment</DialogTitle>
                        <DialogDescription>Book a new vessel for export</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Departure Port</Label>
                                <Select
                                    value={newShipment.departurePort}
                                    onValueChange={(v) => setNewShipment({ ...newShipment, departurePort: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PORTS.departure.map(port => (
                                            <SelectItem key={port} value={port}>{port}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Destination Port</Label>
                                <Select
                                    value={newShipment.destinationPort}
                                    onValueChange={(v) => setNewShipment({ ...newShipment, destinationPort: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PORTS.destination.map(port => (
                                            <SelectItem key={port} value={port}>{port}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Vessel Name</Label>
                            <Input
                                value={newShipment.vesselName}
                                onChange={(e) => setNewShipment({ ...newShipment, vesselName: e.target.value })}
                                placeholder="e.g., MV TOKYO MARU"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>ETD</Label>
                                <Input
                                    type="date"
                                    value={newShipment.etd}
                                    onChange={(e) => setNewShipment({ ...newShipment, etd: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>ETA</Label>
                                <Input
                                    type="date"
                                    value={newShipment.eta}
                                    onChange={(e) => setNewShipment({ ...newShipment, eta: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Shipping Line</Label>
                            <Input
                                value={newShipment.shippingLine}
                                onChange={(e) => setNewShipment({ ...newShipment, shippingLine: e.target.value })}
                                placeholder="e.g., NYK Line"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Shipment Detail Dialog */}
            <Dialog open={!!selectedShipment} onOpenChange={() => setSelectedShipment(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selectedShipment?.shipmentNumber}</DialogTitle>
                        <DialogDescription>
                            {selectedShipment?.departurePort} → {selectedShipment?.destinationPort}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedShipment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Vessel</p>
                                    <p className="font-medium">{selectedShipment.vesselName || 'TBD'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <Badge className={STATUS_COLORS[selectedShipment.status]}>
                                        {selectedShipment.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ETD</p>
                                    <p className="font-medium">{formatDate(selectedShipment.etd)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">ETA</p>
                                    <p className="font-medium">{formatDate(selectedShipment.eta)}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-2">Vehicles ({selectedShipment.vehicles.length})</p>
                                {selectedShipment.vehicles.length === 0 ? (
                                    <p className="text-sm text-gray-400">No vehicles assigned</p>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedShipment.vehicles.map((v) => (
                                            <div key={v.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                <span className="font-mono text-sm">{v.stockNumber}</span>
                                                <span className="text-sm">{v.make} {v.model}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        {selectedShipment?.status === 'BOOKED' && (
                            <Button onClick={() => handleShip(selectedShipment.id)}>
                                <Ship className="mr-2 h-4 w-4" />
                                Mark Shipped
                            </Button>
                        )}
                        {selectedShipment?.status === 'SHIPPED' && (
                            <Button onClick={() => handleDeliver(selectedShipment.id)}>
                                <Truck className="mr-2 h-4 w-4" />
                                Mark Delivered
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
