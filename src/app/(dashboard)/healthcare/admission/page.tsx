"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, BedDouble, Users, Settings, Plus, Search, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Ward {
    id: string;
    name: string;
    type: string;
    floor: number;
    capacity: number;
    beds: Bed[];
}

interface Bed {
    id: string;
    bedNumber: string;
    bedType: string;
    dailyRate: number;
    status: string;
    currentAdmission?: Admission;
}

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
}

interface Admission {
    id: string;
    admissionNumber: string;
    admissionDate: string;
    status: string;
    patient: Patient;
}

interface Visit {
    id: string;
    visitNumber: number;
    status: string;
    patient: Patient;
}

export default function AdmissionPage() {
    const router = useRouter();
    const [wards, setWards] = useState<Ward[]>([]);
    const [pendingAdmissions, setPendingAdmissions] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
    const [admitForm, setAdmitForm] = useState({
        guardianName: '',
        guardianPhone: '',
        guardianRelation: '',
        deposit: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch wards with beds
            const wardsRes = await fetch('/api/healthcare/wards');
            if (wardsRes.ok) {
                const data = await wardsRes.json();
                setWards(data.wards || data || []);
            }

            // Fetch patients recommended for admission
            const visitsRes = await fetch('/api/healthcare/visits?today=true');
            if (visitsRes.ok) {
                const data = await visitsRes.json();
                const pending = (data.visits || data || []).filter(
                    (v: Visit) => v.status === 'RECOMMENDED_ADMISSION'
                );
                setPendingAdmissions(pending);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdmit = async () => {
        if (!selectedBed || !selectedVisit) return;

        try {
            const res = await fetch('/api/healthcare/admissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: selectedVisit.patient.id,
                    visitId: selectedVisit.id,
                    bedId: selectedBed.id,
                    guardianName: admitForm.guardianName,
                    guardianPhone: admitForm.guardianPhone,
                    guardianRelation: admitForm.guardianRelation,
                    depositAmount: parseFloat(admitForm.deposit) || 0,
                }),
            });

            if (!res.ok) throw new Error('Failed to admit');

            toast.success('Patient admitted successfully');
            setIsAdmitDialogOpen(false);
            setSelectedBed(null);
            setSelectedVisit(null);
            setAdmitForm({ guardianName: '', guardianPhone: '', guardianRelation: '', deposit: '' });
            fetchData();
        } catch (error) {
            toast.error('Failed to admit patient');
        }
    };

    const getBedStatusIcon = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return '🟢';
            case 'OCCUPIED':
                return '🔴';
            case 'MAINTENANCE':
                return '🟡';
            case 'RESERVED':
                return '🟠';
            default:
                return '⚪';
        }
    };

    const totalBeds = wards.reduce((sum, w) => sum + w.beds.length, 0);
    const occupiedBeds = wards.reduce((sum, w) =>
        sum + w.beds.filter(b => b.status === 'OCCUPIED').length, 0
    );
    const availableBeds = wards.reduce((sum, w) =>
        sum + w.beds.filter(b => b.status === 'AVAILABLE').length, 0
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admission</h1>
                    <p className="text-gray-600">Bed management and patient admissions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/healthcare/admission/wards')}>
                        <Settings className="mr-2 h-4 w-4" /> Manage Wards
                    </Button>
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Beds</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{totalBeds}</p>
                        </div>
                        <div className="rounded-xl bg-gray-100 p-3 text-gray-600">
                            <BedDouble className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Available</p>
                            <p className="mt-1 text-3xl font-bold text-green-600">{availableBeds}</p>
                        </div>
                        <div className="rounded-xl bg-green-100 p-3 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Occupied</p>
                            <p className="mt-1 text-3xl font-bold text-red-600">{occupiedBeds}</p>
                        </div>
                        <div className="rounded-xl bg-red-100 p-3 text-red-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Admissions</p>
                            <p className="mt-1 text-3xl font-bold text-purple-600">{pendingAdmissions.length}</p>
                        </div>
                        <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="bed-map" className="w-full">
                <TabsList>
                    <TabsTrigger value="bed-map" className="gap-2">
                        <BedDouble className="h-4 w-4" /> Bed Map
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-2">
                        <Clock className="h-4 w-4" /> Pending Admissions ({pendingAdmissions.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bed-map">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>
                    ) : wards.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <BedDouble className="h-12 w-12 mb-4 text-gray-300" />
                                <p>No wards configured</p>
                                <Button className="mt-4" onClick={() => router.push('/healthcare/admission/wards')}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Ward
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {wards.map((ward) => (
                                <Card key={ward.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>{ward.name}</CardTitle>
                                                <CardDescription>
                                                    {ward.type} • Floor {ward.floor} • {ward.beds.filter(b => b.status === 'AVAILABLE').length}/{ward.beds.length} available
                                                </CardDescription>
                                            </div>
                                            <Badge>{ward.type}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                            {ward.beds.map((bed) => (
                                                <button
                                                    key={bed.id}
                                                    onClick={() => {
                                                        if (bed.status === 'AVAILABLE') {
                                                            setSelectedBed(bed);
                                                            setIsAdmitDialogOpen(true);
                                                        } else if (bed.status === 'OCCUPIED' && bed.currentAdmission) {
                                                            router.push(`/healthcare/nursing/${bed.currentAdmission.id}`);
                                                        }
                                                    }}
                                                    className={`
                                                        p-3 rounded-lg border-2 text-center transition-all hover:shadow-md
                                                        ${bed.status === 'AVAILABLE' ? 'border-green-300 bg-green-50 hover:border-green-500' : ''}
                                                        ${bed.status === 'OCCUPIED' ? 'border-red-300 bg-red-50 hover:border-red-500' : ''}
                                                        ${bed.status === 'MAINTENANCE' ? 'border-yellow-300 bg-yellow-50' : ''}
                                                    `}
                                                >
                                                    <span className="text-2xl">{getBedStatusIcon(bed.status)}</span>
                                                    <p className="font-semibold text-sm mt-1">{bed.bedNumber}</p>
                                                    <p className="text-xs text-gray-500">{bed.bedType}</p>
                                                    {bed.currentAdmission && (
                                                        <p className="text-xs text-gray-700 mt-1 truncate">
                                                            {bed.currentAdmission.patient.firstName}
                                                        </p>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Patients Pending Admission</CardTitle>
                            <CardDescription>Patients recommended for admission by doctors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pendingAdmissions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <Users className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No patients pending admission</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pendingAdmissions.map((visit) => (
                                        <div key={visit.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold">
                                                    #{visit.visitNumber}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {visit.patient.firstName} {visit.patient.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{visit.patient.patientNumber}</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => {
                                                setSelectedVisit(visit);
                                                setIsAdmitDialogOpen(true);
                                            }}>
                                                <BedDouble className="mr-2 h-4 w-4" /> Assign Bed
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Admit Dialog */}
            <Dialog open={isAdmitDialogOpen} onOpenChange={setIsAdmitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admit Patient</DialogTitle>
                        <DialogDescription>
                            {selectedVisit ? `Admitting ${selectedVisit.patient.firstName} ${selectedVisit.patient.lastName}` : 'Select a patient and bed'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {pendingAdmissions.length > 0 && !selectedVisit && (
                            <div className="space-y-2">
                                <Label>Select Patient</Label>
                                <Select
                                    value=""
                                    onValueChange={(id) => {
                                        const visit = pendingAdmissions.find(v => v.id === id);
                                        if (visit) setSelectedVisit(visit);
                                    }}
                                >
                                    <SelectTrigger><SelectValue placeholder="Choose patient" /></SelectTrigger>
                                    <SelectContent>
                                        {pendingAdmissions.map((visit) => (
                                            <SelectItem key={visit.id} value={visit.id}>
                                                #{visit.visitNumber} - {visit.patient.firstName} {visit.patient.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {selectedBed && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="font-medium">Selected Bed: {selectedBed.bedNumber}</p>
                                <p className="text-sm text-gray-600">{selectedBed.bedType} • Rs.{selectedBed.dailyRate}/day</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Guardian Name *</Label>
                                <Input
                                    value={admitForm.guardianName}
                                    onChange={(e) => setAdmitForm({ ...admitForm, guardianName: e.target.value })}
                                    placeholder="Guardian name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Guardian Phone *</Label>
                                <Input
                                    value={admitForm.guardianPhone}
                                    onChange={(e) => setAdmitForm({ ...admitForm, guardianPhone: e.target.value })}
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Relation</Label>
                                <Select
                                    value={admitForm.guardianRelation}
                                    onValueChange={(value) => setAdmitForm({ ...admitForm, guardianRelation: value })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SPOUSE">Spouse</SelectItem>
                                        <SelectItem value="PARENT">Parent</SelectItem>
                                        <SelectItem value="CHILD">Child</SelectItem>
                                        <SelectItem value="SIBLING">Sibling</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Initial Deposit (Rs.)</Label>
                                <Input
                                    type="number"
                                    value={admitForm.deposit}
                                    onChange={(e) => setAdmitForm({ ...admitForm, deposit: e.target.value })}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleAdmit}
                            disabled={!selectedVisit || !selectedBed || !admitForm.guardianName || !admitForm.guardianPhone}
                        >
                            Confirm Admission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
