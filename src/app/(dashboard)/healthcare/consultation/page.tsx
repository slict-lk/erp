"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Clock, User, Stethoscope, Play, CheckCircle, AlertCircle, BedDouble } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
    phone: string | null;
    gender: string;
    dateOfBirth: string;
    bloodGroup: string | null;
    allergies: string | null;
}

interface MedicalVisit {
    id: string;
    visitNumber: number;
    visitDate: string;
    type: string;
    status: string;
    chiefComplaint: string | null;
    patient: Patient;
    doctor?: {
        id: string;
        name: string;
    };
}

export default function ConsultationPage() {
    const router = useRouter();
    const [visits, setVisits] = useState<MedicalVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('waiting');

    const fetchVisits = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/healthcare/visits?today=true');
            if (res.ok) {
                const data = await res.json();
                setVisits(data.visits || data || []);
            }
        } catch (error) {
            console.error('Error fetching visits:', error);
            toast.error('Failed to load patient queue');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVisits();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchVisits, 30000);
        return () => clearInterval(interval);
    }, [fetchVisits]);

    const handleStartConsultation = async (visit: MedicalVisit) => {
        try {
            const res = await fetch(`/api/healthcare/visits/${visit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'IN_CONSULTATION' }),
            });

            if (!res.ok) {
                throw new Error('Failed to update visit status');
            }

            toast.success(`Starting consultation for Token #${visit.visitNumber}`);
            router.push(`/healthcare/consultation/${visit.id}`);
        } catch (error) {
            console.error('Error starting consultation:', error);
            toast.error('Failed to start consultation');
        }
    };

    const calculateAge = (dob: string) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'WAITING':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Waiting</Badge>;
            case 'IN_CONSULTATION':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Consultation</Badge>;
            case 'COMPLETED':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
            case 'RECOMMENDED_ADMISSION':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800">For Admission</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getVisitTypeBadge = (type: string) => {
        switch (type) {
            case 'OPD':
                return <Badge className="bg-blue-500">OPD</Badge>;
            case 'ETU':
                return <Badge className="bg-red-500">ETU</Badge>;
            case 'CLINIC':
                return <Badge className="bg-green-500">Clinic</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const waitingVisits = visits.filter(v => v.status === 'WAITING');
    const inConsultationVisits = visits.filter(v => v.status === 'IN_CONSULTATION');
    const completedVisits = visits.filter(v => v.status === 'COMPLETED' || v.status === 'RECOMMENDED_ADMISSION');

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Consultation</h1>
                    <p className="text-gray-600">Today&apos;s patient queue and consultations</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchVisits}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Waiting</p>
                            <p className="mt-1 text-3xl font-bold text-yellow-600">{waitingVisits.length}</p>
                        </div>
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">In Consultation</p>
                            <p className="mt-1 text-3xl font-bold text-blue-600">{inConsultationVisits.length}</p>
                        </div>
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                            <Stethoscope className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Completed</p>
                            <p className="mt-1 text-3xl font-bold text-green-600">{completedVisits.length}</p>
                        </div>
                        <div className="rounded-xl bg-green-100 p-3 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">For Admission</p>
                            <p className="mt-1 text-3xl font-bold text-purple-600">
                                {visits.filter(v => v.status === 'RECOMMENDED_ADMISSION').length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                            <BedDouble className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="waiting" className="gap-2">
                        <Clock className="h-4 w-4" /> Waiting ({waitingVisits.length})
                    </TabsTrigger>
                    <TabsTrigger value="in-consultation" className="gap-2">
                        <Stethoscope className="h-4 w-4" /> In Consultation ({inConsultationVisits.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2">
                        <CheckCircle className="h-4 w-4" /> Completed ({completedVisits.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="waiting" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Waiting Queue</CardTitle>
                            <CardDescription>Patients waiting for consultation</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>
                            ) : waitingVisits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <Clock className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No patients waiting</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {waitingVisits.map((visit) => (
                                        <PatientCard
                                            key={visit.id}
                                            visit={visit}
                                            calculateAge={calculateAge}
                                            getStatusBadge={getStatusBadge}
                                            getVisitTypeBadge={getVisitTypeBadge}
                                            onAction={() => handleStartConsultation(visit)}
                                            actionLabel="Start Consultation"
                                            actionIcon={<Play className="h-4 w-4" />}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="in-consultation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>In Consultation</CardTitle>
                            <CardDescription>Patients currently being seen</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {inConsultationVisits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <Stethoscope className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No active consultations</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {inConsultationVisits.map((visit) => (
                                        <PatientCard
                                            key={visit.id}
                                            visit={visit}
                                            calculateAge={calculateAge}
                                            getStatusBadge={getStatusBadge}
                                            getVisitTypeBadge={getVisitTypeBadge}
                                            onAction={() => router.push(`/healthcare/consultation/${visit.id}`)}
                                            actionLabel="Continue"
                                            actionIcon={<Stethoscope className="h-4 w-4" />}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Completed Today</CardTitle>
                            <CardDescription>Consultations completed today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {completedVisits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                    <CheckCircle className="h-12 w-12 mb-4 text-gray-300" />
                                    <p>No completed consultations today</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {completedVisits.map((visit) => (
                                        <PatientCard
                                            key={visit.id}
                                            visit={visit}
                                            calculateAge={calculateAge}
                                            getStatusBadge={getStatusBadge}
                                            getVisitTypeBadge={getVisitTypeBadge}
                                            onAction={() => router.push(`/healthcare/consultation/${visit.id}`)}
                                            actionLabel="View"
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

// Reusable Patient Card Component
function PatientCard({
    visit,
    calculateAge,
    getStatusBadge,
    getVisitTypeBadge,
    onAction,
    actionLabel,
    actionIcon,
    actionVariant = 'default',
}: {
    visit: MedicalVisit;
    calculateAge: (dob: string) => number;
    getStatusBadge: (status: string) => React.ReactNode;
    getVisitTypeBadge: (type: string) => React.ReactNode;
    onAction: () => void;
    actionLabel: string;
    actionIcon?: React.ReactNode;
    actionVariant?: 'default' | 'outline';
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xl">
                    #{visit.visitNumber}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-lg">
                            {visit.patient.firstName} {visit.patient.lastName}
                        </p>
                        {getVisitTypeBadge(visit.type)}
                    </div>
                    <p className="text-sm text-gray-500">
                        {visit.patient.patientNumber} • {visit.patient.gender}/{calculateAge(visit.patient.dateOfBirth)}yrs
                        {visit.patient.bloodGroup && ` • ${visit.patient.bloodGroup}`}
                    </p>
                    {visit.patient.allergies && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" /> Allergies: {visit.patient.allergies}
                        </p>
                    )}
                    {visit.chiefComplaint && (
                        <p className="text-sm text-gray-600 mt-1">
                            Chief Complaint: {visit.chiefComplaint}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {getStatusBadge(visit.status)}
                <Button variant={actionVariant} onClick={onAction}>
                    {actionIcon && <span className="mr-2">{actionIcon}</span>}
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
}
