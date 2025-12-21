"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, BedDouble, Wrench, Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Ward {
    id: string;
    name: string;
    code: string;
    type: string;
    floor: string;
    capacity: number;
    isActive: boolean;
    beds: Bed[];
}

interface Bed {
    id: string;
    bedNumber: string;
    bedType: string;
    dailyRate: number;
    status: string;
}

export default function WardsManagementPage() {
    const router = useRouter();
    const [wards, setWards] = useState<Ward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddWardOpen, setIsAddWardOpen] = useState(false);
    const [isAddBedOpen, setIsAddBedOpen] = useState(false);
    const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
    const [wardForm, setWardForm] = useState({
        name: '',
        type: 'GENERAL',
        floor: '1',
        capacity: 10,
    });
    const [bedForm, setBedForm] = useState({
        bedNumber: '',
        bedType: 'STANDARD',
        dailyRate: 0,
    });

    const fetchWards = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/healthcare/wards');
            if (res.ok) {
                const data = await res.json();
                setWards(data.wards || data || []);
            }
        } catch (error) {
            console.error('Error fetching wards:', error);
            toast.error('Failed to load wards');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWards();
    }, [fetchWards]);

    const handleCreateWard = async () => {
        if (!wardForm.name) {
            toast.error('Ward name is required');
            return;
        }

        try {
            const res = await fetch('/api/healthcare/wards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wardForm),
            });

            if (!res.ok) throw new Error('Failed to create ward');

            toast.success('Ward created successfully');
            setIsAddWardOpen(false);
            setWardForm({ name: '', type: 'GENERAL', floor: '1', capacity: 10 });
            fetchWards();
        } catch (error) {
            toast.error('Failed to create ward');
        }
    };

    const handleCreateBed = async () => {
        if (!selectedWard || !bedForm.bedNumber) {
            toast.error('Bed number is required');
            return;
        }

        try {
            const res = await fetch('/api/healthcare/beds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...bedForm,
                    wardId: selectedWard.id,
                }),
            });

            if (!res.ok) throw new Error('Failed to create bed');

            toast.success('Bed created successfully');
            setIsAddBedOpen(false);
            setBedForm({ bedNumber: '', bedType: 'STANDARD', dailyRate: 0 });
            fetchWards();
        } catch (error) {
            toast.error('Failed to create bed');
        }
    };

    const handleUpdateBedStatus = async (bedId: string, status: string) => {
        try {
            const res = await fetch(`/api/healthcare/beds/${bedId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error('Failed to update bed');

            toast.success('Bed status updated');
            fetchWards();
        } catch (error) {
            toast.error('Failed to update bed status');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <Badge className="bg-green-100 text-green-800">Available</Badge>;
            case 'OCCUPIED':
                return <Badge className="bg-red-100 text-red-800">Occupied</Badge>;
            case 'MAINTENANCE':
                return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const totalBeds = wards.reduce((sum, w) => sum + w.beds.length, 0);
    const availableBeds = wards.reduce((sum, w) => sum + w.beds.filter(b => b.status === 'AVAILABLE').length, 0);
    const occupiedBeds = wards.reduce((sum, w) => sum + w.beds.filter(b => b.status === 'OCCUPIED').length, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwSDMwVjBoMnYzNHptLTQgMEgyOFYwaDJ2MzR6bS00IDBoLTJWMGgydjM0em0tNCAwSDIwVjBoMnYzNHptLTQgMEgxNlYwaDJ2MzR6bS00IDBoLTJWMGgydjM0em0tNCAwSDhWMGgydjM0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
                <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/healthcare/admission')} className="text-white hover:bg-white/20">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Ward & Bed Management</h1>
                            <p className="mt-1 text-emerald-100">Configure wards and hospital beds</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchWards} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                        </Button>
                        <Dialog open={isAddWardOpen} onOpenChange={setIsAddWardOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-white text-emerald-700 hover:bg-white/90">
                                    <Plus className="mr-2 h-4 w-4" /> Add Ward
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Ward</DialogTitle>
                                    <DialogDescription>Create a new ward in the hospital</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Ward Name *</Label>
                                            <Input
                                                placeholder="e.g., Male Ward A"
                                                value={wardForm.name}
                                                onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ward Type</Label>
                                            <Select value={wardForm.type} onValueChange={(v) => setWardForm({ ...wardForm, type: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GENERAL">General</SelectItem>
                                                    <SelectItem value="PRIVATE">Private</SelectItem>
                                                    <SelectItem value="ICU">ICU</SelectItem>
                                                    <SelectItem value="MATERNITY">Maternity</SelectItem>
                                                    <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
                                                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Floor</Label>
                                            <Input
                                                placeholder="e.g., 1"
                                                value={wardForm.floor}
                                                onChange={(e) => setWardForm({ ...wardForm, floor: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Capacity</Label>
                                            <Input
                                                type="number"
                                                placeholder="10"
                                                value={wardForm.capacity}
                                                onChange={(e) => setWardForm({ ...wardForm, capacity: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button onClick={handleCreateWard}>Create Ward</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-gray-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Wards</p>
                            <p className="mt-1 text-4xl font-bold text-slate-700">{wards.length}</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-gray-600 p-4 text-white shadow-lg">
                            <Building2 className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Total Beds</p>
                            <p className="mt-1 text-4xl font-bold text-blue-700">{totalBeds}</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg">
                            <BedDouble className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-emerald-600">Available</p>
                            <p className="mt-1 text-4xl font-bold text-emerald-700">{availableBeds}</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white shadow-lg">
                            <BedDouble className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-rose-50 to-red-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-rose-600">Occupied</p>
                            <p className="mt-1 text-4xl font-bold text-rose-700">{occupiedBeds}</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 p-4 text-white shadow-lg">
                            <BedDouble className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Wards List */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-emerald-500" />
                        Wards & Beds
                    </CardTitle>
                    <CardDescription>Manage hospital wards and bed configuration</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                            <p className="mt-4 text-gray-500">Loading wards...</p>
                        </div>
                    ) : wards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                            <div className="rounded-full bg-gray-100 p-4 mb-4">
                                <Building2 className="h-10 w-10 text-gray-300" />
                            </div>
                            <p className="font-medium">No wards configured</p>
                            <p className="text-sm text-gray-400 mt-1">Create your first ward to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {wards.map((ward) => (
                                <Card key={ward.id} className="border overflow-hidden">
                                    <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{ward.name}</CardTitle>
                                                <CardDescription>
                                                    {ward.type} • Floor {ward.floor} • {ward.beds.length} beds
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge>{ward.type}</Badge>
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedWard(ward);
                                                        setIsAddBedOpen(true);
                                                    }}
                                                >
                                                    <Plus className="mr-1 h-4 w-4" /> Add Bed
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {ward.beds.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">No beds in this ward</p>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {ward.beds.map((bed) => (
                                                    <div
                                                        key={bed.id}
                                                        className={`
                                                            p-3 rounded-lg border-2 text-center transition-all
                                                            ${bed.status === 'AVAILABLE' ? 'border-green-300 bg-green-50' : ''}
                                                            ${bed.status === 'OCCUPIED' ? 'border-red-300 bg-red-50' : ''}
                                                            ${bed.status === 'MAINTENANCE' ? 'border-yellow-300 bg-yellow-50' : ''}
                                                        `}
                                                    >
                                                        <p className="font-bold text-lg">{bed.bedNumber}</p>
                                                        <p className="text-xs text-gray-500">{bed.bedType}</p>
                                                        <p className="text-xs text-gray-600">Rs.{bed.dailyRate}/day</p>
                                                        {getStatusBadge(bed.status)}
                                                        {bed.status !== 'OCCUPIED' && (
                                                            <div className="mt-2">
                                                                <Select
                                                                    value={bed.status}
                                                                    onValueChange={(v) => handleUpdateBedStatus(bed.id, v)}
                                                                >
                                                                    <SelectTrigger className="h-7 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="AVAILABLE">Available</SelectItem>
                                                                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Bed Dialog */}
            <Dialog open={isAddBedOpen} onOpenChange={setIsAddBedOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Bed</DialogTitle>
                        <DialogDescription>
                            Adding bed to: {selectedWard?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Bed Number *</Label>
                            <Input
                                placeholder="e.g., A-101"
                                value={bedForm.bedNumber}
                                onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Bed Type</Label>
                                <Select value={bedForm.bedType} onValueChange={(v) => setBedForm({ ...bedForm, bedType: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STANDARD">Standard</SelectItem>
                                        <SelectItem value="ELECTRIC">Electric</SelectItem>
                                        <SelectItem value="ICU">ICU</SelectItem>
                                        <SelectItem value="PEDIATRIC">Pediatric</SelectItem>
                                        <SelectItem value="BARIATRIC">Bariatric</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Daily Rate (Rs.)</Label>
                                <Input
                                    type="number"
                                    placeholder="1000"
                                    value={bedForm.dailyRate}
                                    onChange={(e) => setBedForm({ ...bedForm, dailyRate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleCreateBed}>Create Bed</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
