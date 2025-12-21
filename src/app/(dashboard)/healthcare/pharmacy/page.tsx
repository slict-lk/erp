"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, Pill, CheckCircle, AlertTriangle, FileSignature, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
}

interface Prescription {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string | null;
    quantity: number;
    isSignedByDoctor: boolean;
    signedAt: string | null;
    isDispensed: boolean;
    dispensedAt: string | null;
}

interface Visit {
    id: string;
    visitNumber: number;
    visitDate: string;
    type: string;
    status: string;
    patient: Patient;
}

interface PrescriptionWithVisit extends Prescription {
    visit: Visit;
}

export default function PharmacyPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [prescriptions, setPrescriptions] = useState<PrescriptionWithVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [visitPrescriptions, setVisitPrescriptions] = useState<Prescription[]>([]);
    const [dispensing, setDispensing] = useState<string | null>(null);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch today's completed visits
            const res = await fetch('/api/healthcare/visits?today=true');
            if (res.ok) {
                const data = await res.json();
                const completedVisits = (data.visits || data || []).filter(
                    (v: Visit) => v.status === 'COMPLETED' || v.status === 'RECOMMENDED_ADMISSION' || v.status === 'IN_CONSULTATION'
                );
                setVisits(completedVisits);
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

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchData();
            return;
        }
        // Search by patient number or visit number
        // For now, filter existing visits
        const filtered = visits.filter(v =>
            v.patient.patientNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.visitNumber.toString().includes(searchQuery) ||
            v.patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.patient.lastName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setVisits(filtered);
    };

    const handleViewPrescriptions = async (visit: Visit) => {
        try {
            setSelectedVisit(visit);
            const res = await fetch(`/api/healthcare/visits/${visit.id}/prescriptions`);
            if (res.ok) {
                const data = await res.json();
                setVisitPrescriptions(data.prescriptions || data || []);
            }
            setIsDetailDialogOpen(true);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Failed to load prescriptions');
        }
    };

    const handleDispense = async (prescriptionId: string) => {
        const prescription = visitPrescriptions.find(p => p.id === prescriptionId);

        if (!prescription) return;

        if (!prescription.isSignedByDoctor) {
            toast.error('Cannot dispense unsigned prescription');
            return;
        }

        if (prescription.isDispensed) {
            toast.error('Already dispensed');
            return;
        }

        try {
            setDispensing(prescriptionId);
            const res = await fetch(`/api/healthcare/prescriptions/${prescriptionId}/dispense`, {
                method: 'POST',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to dispense');
            }

            toast.success('Prescription dispensed');
            // Refresh prescriptions
            handleViewPrescriptions(selectedVisit!);
        } catch (error) {
            console.error('Error dispensing:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to dispense');
        } finally {
            setDispensing(null);
        }
    };

    const pendingCount = visitPrescriptions.filter(p => !p.isDispensed && p.isSignedByDoctor).length;
    const dispensedCount = visitPrescriptions.filter(p => p.isDispensed).length;
    const unsignedCount = visitPrescriptions.filter(p => !p.isSignedByDoctor).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pharmacy</h1>
                    <p className="text-gray-600">Dispense prescriptions for patients</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Visits with Prescriptions</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{visits.length}</p>
                        </div>
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                            <Pill className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Dispense</p>
                            <p className="mt-1 text-3xl font-bold text-yellow-600">{pendingCount}</p>
                        </div>
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                            <Package className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Dispensed Today</p>
                            <p className="mt-1 text-3xl font-bold text-green-600">{dispensedCount}</p>
                        </div>
                        <div className="rounded-xl bg-green-100 p-3 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Patient Prescriptions</CardTitle>
                    <CardDescription>Search by patient number, name, or token number</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search by PHN, name, or token #..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch}>Search</Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>
                    ) : visits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Pill className="h-12 w-12 mb-4 text-gray-300" />
                            <p>No visits with prescriptions found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visits.map((visit) => (
                                <div key={visit.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                                            #{visit.visitNumber}
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {visit.patient.firstName} {visit.patient.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {visit.patient.patientNumber} • {visit.type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={visit.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                            {visit.status}
                                        </Badge>
                                        <Button onClick={() => handleViewPrescriptions(visit)}>
                                            <Pill className="mr-2 h-4 w-4" /> View Prescriptions
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Prescription Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Prescriptions for Token #{selectedVisit?.visitNumber}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedVisit?.patient.firstName} {selectedVisit?.patient.lastName} • {selectedVisit?.patient.patientNumber}
                        </DialogDescription>
                    </DialogHeader>

                    {visitPrescriptions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No prescriptions for this visit</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {unsignedCount > 0 && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-yellow-800">Unsigned Prescriptions</p>
                                        <p className="text-sm text-yellow-700">
                                            {unsignedCount} prescription(s) are not signed by the doctor. Cannot dispense until signed.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {visitPrescriptions.map((rx, index) => (
                                <div
                                    key={rx.id}
                                    className={`border rounded-lg p-4 ${rx.isDispensed ? 'bg-green-50 border-green-200' : !rx.isSignedByDoctor ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{index + 1}. {rx.medication}</span>
                                                {rx.isSignedByDoctor ? (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <FileSignature className="mr-1 h-3 w-3" /> Signed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                                                        Unsigned
                                                    </Badge>
                                                )}
                                                {rx.isDispensed && (
                                                    <Badge className="bg-blue-100 text-blue-800">Dispensed</Badge>
                                                )}
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                <p><strong>Dosage:</strong> {rx.dosage}</p>
                                                <p><strong>Frequency:</strong> {rx.frequency}</p>
                                                <p><strong>Duration:</strong> {rx.duration}</p>
                                                <p><strong>Quantity:</strong> {rx.quantity}</p>
                                                {rx.instructions && (
                                                    <p><strong>Instructions:</strong> {rx.instructions}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            {rx.isDispensed ? (
                                                <Button variant="outline" disabled className="text-green-600">
                                                    <CheckCircle className="mr-2 h-4 w-4" /> Dispensed
                                                </Button>
                                            ) : rx.isSignedByDoctor ? (
                                                <Button
                                                    onClick={() => handleDispense(rx.id)}
                                                    disabled={dispensing === rx.id}
                                                >
                                                    {dispensing === rx.id ? 'Dispensing...' : 'Dispense'}
                                                </Button>
                                            ) : (
                                                <Button variant="outline" disabled className="text-yellow-600">
                                                    <AlertTriangle className="mr-2 h-4 w-4" /> Needs Signature
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
