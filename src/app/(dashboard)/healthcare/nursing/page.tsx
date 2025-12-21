"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, BedDouble, Users, Heart, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    patientNumber: string;
}

interface Bed {
    id: string;
    bedNumber: string;
    bedType: string;
    ward: {
        id: string;
        name: string;
    };
}

interface Admission {
    id: string;
    admissionNumber: string;
    admissionDate: string;
    status: string;
    patient: Patient;
    bed: Bed;
    vitalSigns?: VitalSign[];
}

interface VitalSign {
    id: string;
    temperature: number | null;
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    pulse: number | null;
    respiratoryRate: number | null;
    oxygenSaturation: number | null;
    recordedAt: string;
}

export default function NursingStationPage() {
    const router = useRouter();
    const [admissions, setAdmissions] = useState<Admission[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAdmissions = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/healthcare/admissions?status=ADMITTED');
            if (res.ok) {
                const data = await res.json();
                setAdmissions(data.admissions || data || []);
            }
        } catch (error) {
            console.error('Error fetching admissions:', error);
            toast.error('Failed to load admissions');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmissions();
    }, [fetchAdmissions]);

    const getVitalsStatus = (vitalSigns?: VitalSign[]) => {
        if (!vitalSigns || vitalSigns.length === 0) {
            return { status: 'no-data', label: 'No Vitals', color: 'bg-gray-100 text-gray-800' };
        }

        const lastVital = vitalSigns[0];
        const hoursAgo = (Date.now() - new Date(lastVital.recordedAt).getTime()) / (1000 * 60 * 60);

        if (hoursAgo > 4) {
            return { status: 'overdue', label: 'Vitals Overdue', color: 'bg-red-100 text-red-800' };
        } else if (hoursAgo > 2) {
            return { status: 'due-soon', label: 'Due Soon', color: 'bg-yellow-100 text-yellow-800' };
        }
        return { status: 'recent', label: 'Recent', color: 'bg-green-100 text-green-800' };
    };

    const formatVitals = (v: VitalSign) => {
        const parts = [];
        if (v.temperature) parts.push(`${v.temperature}°F`);
        if (v.bloodPressureSystolic && v.bloodPressureDiastolic) {
            parts.push(`${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`);
        }
        if (v.pulse) parts.push(`${v.pulse}bpm`);
        if (v.oxygenSaturation) parts.push(`SpO2: ${v.oxygenSaturation}%`);
        return parts.join(' • ');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Nursing Station</h1>
                    <p className="text-gray-600">Monitor and care for admitted patients</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAdmissions}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Patients</p>
                            <p className="mt-1 text-3xl font-bold text-blue-600">{admissions.length}</p>
                        </div>
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Vitals Overdue</p>
                            <p className="mt-1 text-3xl font-bold text-red-600">
                                {admissions.filter(a => getVitalsStatus(a.vitalSigns).status === 'overdue').length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-red-100 p-3 text-red-600">
                            <Activity className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Due Soon</p>
                            <p className="mt-1 text-3xl font-bold text-yellow-600">
                                {admissions.filter(a => getVitalsStatus(a.vitalSigns).status === 'due-soon').length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Critical</p>
                            <p className="mt-1 text-3xl font-bold text-purple-600">0</p>
                        </div>
                        <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                            <Heart className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Patient List */}
            <Card>
                <CardHeader>
                    <CardTitle>Admitted Patients</CardTitle>
                    <CardDescription>Click a patient to record vitals and manage care</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>
                    ) : admissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <BedDouble className="h-12 w-12 mb-4 text-gray-300" />
                            <p>No admitted patients</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {admissions.map((admission) => {
                                const vitalsStatus = getVitalsStatus(admission.vitalSigns);
                                const lastVital = admission.vitalSigns?.[0];

                                return (
                                    <div
                                        key={admission.id}
                                        onClick={() => router.push(`/healthcare/nursing/${admission.id}`)}
                                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg bg-blue-100 text-blue-600">
                                                <BedDouble className="h-5 w-5" />
                                                <span className="text-xs font-bold mt-0.5">{admission.bed.bedNumber}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">
                                                        {admission.patient.firstName} {admission.patient.lastName}
                                                    </p>
                                                    <Badge variant="outline">{admission.bed.ward.name}</Badge>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    {admission.patient.patientNumber} • {admission.admissionNumber}
                                                </p>
                                                {lastVital && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Last: {formatVitals(lastVital)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={vitalsStatus.color}>{vitalsStatus.label}</Badge>
                                            <Button variant="outline" size="sm">
                                                <Activity className="mr-2 h-4 w-4" /> Record Vitals
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
