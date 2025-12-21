"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, QrCode, Printer, RefreshCw, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { TokenSlip } from '@/components/healthcare/TokenSlip';

interface Patient {
    id: string;
    patientNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string | null;
    email: string | null;
    bloodGroup: string | null;
    city: string | null;
    status: string;
}

interface MedicalVisit {
    id: string;
    visitNumber: number;
    visitDate: string;
    type: string;
    status: string;
    patient: {
        id: string;
        firstName: string;
        lastName: string;
        patientNumber: string;
    };
    doctor?: {
        name: string;
    };
}

export default function ReceptionPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [todayVisits, setTodayVisits] = useState<MedicalVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
    const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
    const [creatingVisit, setCreatingVisit] = useState(false);
    const [createdVisit, setCreatedVisit] = useState<{
        id: string;
        visitNumber: number;
        visitDate: string;
        type: string;
        patientName: string;
        patientNumber: string;
    } | null>(null);
    const [isTokenSlipOpen, setIsTokenSlipOpen] = useState(false);
    const [newPatientForm, setNewPatientForm] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'MALE',
        phone: '',
        email: '',
        bloodGroup: '',
        city: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
        chronicConditions: '',
        notificationPreference: 'WHATSAPP',
        hasWhatsApp: true,
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [patientsRes, visitsRes] = await Promise.all([
                fetch('/api/healthcare/patients'),
                fetch('/api/healthcare/visits?today=true'),
            ]);

            if (patientsRes.ok) {
                const data = await patientsRes.json();
                setPatients(data.patients || data || []);
            }
            if (visitsRes.ok) {
                const data = await visitsRes.json();
                setTodayVisits(data.visits || data || []);
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
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const res = await fetch(`/api/healthcare/patients/search?q=${encodeURIComponent(searchQuery)}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.patients || data || []);
            }
        } catch (error) {
            console.error('Error searching:', error);
            toast.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleCreatePatient = async () => {
        try {
            const res = await fetch('/api/healthcare/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPatientForm),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create patient');
            }

            const patient = await res.json();
            toast.success(`Patient ${patient.patientNumber} created successfully`);
            setIsNewPatientOpen(false);
            setNewPatientForm({
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                gender: 'MALE',
                phone: '',
                email: '',
                bloodGroup: '',
                city: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                allergies: '',
                chronicConditions: '',
                notificationPreference: 'WHATSAPP',
                hasWhatsApp: true,
            });
            fetchData();
        } catch (error) {
            console.error('Error creating patient:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create patient');
        }
    };

    const handleCreateVisit = async (visitType: 'OPD' | 'ETU' | 'CLINIC') => {
        if (!selectedPatient) return;

        try {
            setCreatingVisit(true);
            const res = await fetch('/api/healthcare/visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    type: visitType,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create visit');
            }

            const visit = await res.json();
            toast.success(`Token #${visit.visitNumber} generated for ${selectedPatient.firstName} ${selectedPatient.lastName}`);

            // Show token slip
            setCreatedVisit({
                id: visit.id,
                visitNumber: visit.visitNumber,
                visitDate: visit.visitDate || new Date().toISOString(),
                type: visitType,
                patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
                patientNumber: selectedPatient.patientNumber,
            });
            setIsVisitDialogOpen(false);
            setIsTokenSlipOpen(true);
            setSelectedPatient(null);
            fetchData();
        } catch (error) {
            console.error('Error creating visit:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create visit');
        } finally {
            setCreatingVisit(false);
        }
    };

    const openVisitDialog = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsVisitDialogOpen(true);
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

    return (
        <div className="p-6 space-y-6">
            {/* Premium Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwSDMwVjBoMnYzNHptLTQgMEgyOFYwaDJ2MzR6bS00IDBoLTJWMGgydjM0em0tNCAwSDIwVjBoMnYzNHptLTQgMEgxNlYwaDJ2MzR6bS00IDBoLTJWMGgydjM0em0tNCAwSDhWMGgydjM0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
                <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Reception Desk</h1>
                        <p className="mt-1 text-blue-100">Patient registration and token issuance</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchData} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                        </Button>
                        <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" /> New Patient
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Register New Patient</DialogTitle>
                                    <DialogDescription>Enter patient details to create a new record</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            value={newPatientForm.firstName}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            value={newPatientForm.lastName}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">Date of Birth *</Label>
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={newPatientForm.dateOfBirth}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gender">Gender *</Label>
                                        <Select
                                            value={newPatientForm.gender}
                                            onValueChange={(value) => setNewPatientForm({ ...newPatientForm, gender: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            value={newPatientForm.phone}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                                            placeholder="e.g., 0771234567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newPatientForm.email}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                                            placeholder="patient@email.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bloodGroup">Blood Group</Label>
                                        <Select
                                            value={newPatientForm.bloodGroup}
                                            onValueChange={(value) => setNewPatientForm({ ...newPatientForm, bloodGroup: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select blood group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A+">A+</SelectItem>
                                                <SelectItem value="A-">A-</SelectItem>
                                                <SelectItem value="B+">B+</SelectItem>
                                                <SelectItem value="B-">B-</SelectItem>
                                                <SelectItem value="AB+">AB+</SelectItem>
                                                <SelectItem value="AB-">AB-</SelectItem>
                                                <SelectItem value="O+">O+</SelectItem>
                                                <SelectItem value="O-">O-</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={newPatientForm.city}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, city: e.target.value })}
                                            placeholder="Enter city"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                                        <Input
                                            id="emergencyName"
                                            value={newPatientForm.emergencyContactName}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContactName: e.target.value })}
                                            placeholder="Contact person name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                                        <Input
                                            id="emergencyPhone"
                                            value={newPatientForm.emergencyContactPhone}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContactPhone: e.target.value })}
                                            placeholder="Contact phone"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="allergies">Known Allergies</Label>
                                        <Input
                                            id="allergies"
                                            value={newPatientForm.allergies}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, allergies: e.target.value })}
                                            placeholder="List any known allergies"
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="chronic">Chronic Conditions</Label>
                                        <Input
                                            id="chronic"
                                            value={newPatientForm.chronicConditions}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, chronicConditions: e.target.value })}
                                            placeholder="List any chronic conditions"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Notification Preference</Label>
                                        <Select
                                            value={newPatientForm.notificationPreference}
                                            onValueChange={(value) => setNewPatientForm({ ...newPatientForm, notificationPreference: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                                <SelectItem value="SMS">SMS</SelectItem>
                                                <SelectItem value="BOTH">Both</SelectItem>
                                                <SelectItem value="NONE">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="hasWhatsApp"
                                            checked={newPatientForm.hasWhatsApp}
                                            onChange={(e) => setNewPatientForm({ ...newPatientForm, hasWhatsApp: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="hasWhatsApp">Has WhatsApp</Label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        onClick={handleCreatePatient}
                                        disabled={!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.dateOfBirth}
                                    >
                                        Create Patient
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-blue-600">Today&apos;s Tokens</p>
                            <p className="mt-1 text-4xl font-bold text-blue-700">{todayVisits.length}</p>
                            <p className="mt-1 text-xs text-blue-500">Total patients today</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                            <QrCode className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-yellow-600/10"></div>
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-amber-600">Waiting</p>
                            <p className="mt-1 text-4xl font-bold text-amber-700">
                                {todayVisits.filter(v => v.status === 'WAITING').length}
                            </p>
                            <p className="mt-1 text-xs text-amber-500">In queue now</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 p-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                            <Clock className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-green-100 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/10"></div>
                    <CardContent className="relative flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-emerald-600">Registered Patients</p>
                            <p className="mt-1 text-4xl font-bold text-emerald-700">{patients.length}</p>
                            <p className="mt-1 text-xs text-emerald-500">Total in system</p>
                        </div>
                        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 text-white shadow-lg group-hover:shadow-xl transition-all">
                            <User className="h-7 w-7" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="queue" className="w-full">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="queue" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Today&apos;s Queue</TabsTrigger>
                    <TabsTrigger value="search" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Patient Search</TabsTrigger>
                </TabsList>

                <TabsContent value="queue" className="space-y-4">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-indigo-500" />
                                Today&apos;s Visit Queue
                            </CardTitle>
                            <CardDescription>Patients registered for today</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                                    <p className="mt-4 text-gray-500">Loading queue...</p>
                                </div>
                            ) : todayVisits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                                        <QrCode className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <p className="font-medium">No visits registered for today</p>
                                    <p className="text-sm text-gray-400 mt-1">Register a new patient to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayVisits.map((visit) => (
                                        <div key={visit.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gradient-to-r from-white to-gray-50/50 p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
                                                    #{visit.visitNumber}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {visit.patient.firstName} {visit.patient.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {visit.patient.patientNumber} • {visit.type}
                                                        {visit.doctor && ` • Dr. ${visit.doctor.name}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(visit.status)}
                                                <Button variant="outline" size="sm">
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="search" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Patient</CardTitle>
                            <CardDescription>Search by name, phone number, or patient number</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Search by name, phone, or PHN..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <Button onClick={handleSearch} disabled={searching}>
                                    {searching ? 'Searching...' : 'Search'}
                                </Button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-2">
                                    {searchResults.map((patient) => (
                                        <div key={patient.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold">
                                                    {patient.firstName[0]}{patient.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {patient.firstName} {patient.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {patient.patientNumber} • {patient.gender}/{calculateAge(patient.dateOfBirth)}yrs
                                                        {patient.phone && ` • ${patient.phone}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button onClick={() => openVisitDialog(patient)}>
                                                <QrCode className="mr-2 h-4 w-4" /> Create Token
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Visit Creation Dialog */}
            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Visit Token</DialogTitle>
                        <DialogDescription>
                            Generate a token for {selectedPatient?.firstName} {selectedPatient?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-gray-600">Select visit type:</p>
                        <div className="grid grid-cols-3 gap-4">
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2"
                                onClick={() => handleCreateVisit('OPD')}
                                disabled={creatingVisit}
                            >
                                <span className="text-2xl">🏥</span>
                                <span>OPD</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2 border-red-200 hover:bg-red-50"
                                onClick={() => handleCreateVisit('ETU')}
                                disabled={creatingVisit}
                            >
                                <span className="text-2xl">🚑</span>
                                <span>ETU</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2"
                                onClick={() => handleCreateVisit('CLINIC')}
                                disabled={creatingVisit}
                            >
                                <span className="text-2xl">👨‍⚕️</span>
                                <span>Clinic</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Token Slip Dialog */}
            <Dialog open={isTokenSlipOpen} onOpenChange={setIsTokenSlipOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Token Generated Successfully</DialogTitle>
                        <DialogDescription>
                            Print this token for the patient
                        </DialogDescription>
                    </DialogHeader>
                    {createdVisit && (
                        <TokenSlip
                            visitId={createdVisit.id}
                            tokenNumber={createdVisit.visitNumber}
                            patientName={createdVisit.patientName}
                            patientNumber={createdVisit.patientNumber}
                            visitType={createdVisit.type}
                            visitDate={createdVisit.visitDate}
                        />
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTokenSlipOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
