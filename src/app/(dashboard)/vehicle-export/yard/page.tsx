"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardCheck, RefreshCw, CheckCircle, Clock, Play, Camera, User, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Vehicle {
    id: string;
    stockNumber: string;
    make: string;
    model: string;
    year: number;
    location: string | null;
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

    vehicle: Vehicle;
    materials?: { id: string; partName: string; quantity: number; unitCost: number; totalCost: number }[];
}


const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    DONE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

const TYPE_COLORS: Record<string, string> = {
    INSPECTION: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    REPAIR: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    CLEANING: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    DOCUMENT_CHECK: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    PHOTO_SHOOT: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
};

export default function YardJobsPage() {
    const [jobs, setJobs] = useState<YardJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedJob, setSelectedJob] = useState<YardJob | null>(null);
    const [processing, setProcessing] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const { toast } = useToast();

    const fetchJobs = useCallback(async () => {
        try {
            setRefreshing(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/vehicle-export/yard-jobs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const updateJobStatus = async (jobId: string, newStatus: string, notes?: string) => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/vehicle-export/yard-jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    notes: notes || undefined,
                }),
            });
            if (res.ok) {
                toast({ title: 'Job Updated', description: `Status changed to ${newStatus}` });
                fetchJobs();
                setSelectedJob(null);
                setCompletionNotes('');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update job', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const todoCount = jobs.filter(j => j.status === 'TODO').length;
    const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;
    const doneCount = jobs.filter(j => j.status === 'DONE').length;

    const filteredJobs = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Yard Jobs
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Repair and inspection task queue
                    </p>
                </div>
                <Button variant="outline" onClick={fetchJobs} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-3">
                <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                >
                    All
                    <Badge variant="secondary" className="ml-2">{jobs.length}</Badge>
                </Button>
                <Button
                    variant={statusFilter === 'TODO' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('TODO')}
                    className={statusFilter === 'TODO' ? '' : 'border-gray-300'}
                >
                    <Clock className="h-4 w-4 mr-1" />
                    Todo
                    <Badge variant="secondary" className="ml-2">{todoCount}</Badge>
                </Button>
                <Button
                    variant={statusFilter === 'IN_PROGRESS' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('IN_PROGRESS')}
                    className={statusFilter === 'IN_PROGRESS' ? '' : 'border-yellow-300'}
                >
                    <Play className="h-4 w-4 mr-1" />
                    In Progress
                    <Badge variant="secondary" className="ml-2">{inProgressCount}</Badge>
                </Button>
                <Button
                    variant={statusFilter === 'DONE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('DONE')}
                    className={statusFilter === 'DONE' ? '' : 'border-green-300'}
                >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Done
                    <Badge variant="secondary" className="ml-2">{doneCount}</Badge>
                </Button>
            </div>

            {/* Jobs Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                    Loading jobs...
                </div>
            ) : filteredJobs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ClipboardCheck className="h-12 w-12 mb-2 text-gray-300" />
                        <p className="text-gray-500">No jobs found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => (
                        <Card
                            key={job.id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedJob(job)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{job.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <Package className="h-3 w-3" />
                                            {job.vehicle.stockNumber}
                                        </CardDescription>
                                    </div>
                                    <Badge className={STATUS_COLORS[job.status]}>
                                        {job.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className={TYPE_COLORS[job.type]}>
                                            {job.type}
                                        </Badge>
                                        {job.assignedTo && (
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {job.assignedTo}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Job Detail Dialog */}
            <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedJob?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedJob?.vehicle.stockNumber} - {selectedJob?.vehicle.make} {selectedJob?.vehicle.model}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedJob && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className={STATUS_COLORS[selectedJob.status]}>
                                    {selectedJob.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className={TYPE_COLORS[selectedJob.type]}>
                                    {selectedJob.type}
                                </Badge>
                            </div>

                            {selectedJob.notes && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                        {selectedJob.notes}
                                    </p>
                                </div>
                            )}

                            {selectedJob.status !== 'DONE' && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Completion Notes</p>
                                    <Textarea
                                        value={completionNotes}
                                        onChange={(e) => setCompletionNotes(e.target.value)}
                                        placeholder="Add notes about work done..."
                                        rows={3}
                                    />
                                </div>
                            )}




                            {/* Materials Section (Phase 5) */}
                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-semibold mb-2">Materials & Parts</h4>
                                {selectedJob.materials && selectedJob.materials.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                        {selectedJob.materials.map((m: any) => (
                                            <div key={m.id} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                <span>{m.partName} (x{m.quantity})</span>
                                                <span>${Number(m.totalCost).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between font-bold text-sm pt-2 border-t">
                                            <span>Total Material Cost</span>
                                            <span>${selectedJob.materials.reduce((acc: number, m: any) => acc + Number(m.totalCost), 0).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 mb-4">No materials recorded</p>
                                )}

                                {selectedJob.status !== 'DONE' && (
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Part Name (e.g. Battery)"
                                            id="new-material-name"
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Qty"
                                                className="w-20"
                                                id="new-material-qty"
                                                defaultValue="1"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Unit Cost ($)"
                                                className="w-32"
                                                id="new-material-cost"
                                            />
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={async () => {
                                                    const nameEl = document.getElementById('new-material-name') as HTMLInputElement;
                                                    const qtyEl = document.getElementById('new-material-qty') as HTMLInputElement;
                                                    const costEl = document.getElementById('new-material-cost') as HTMLInputElement;

                                                    if (!nameEl.value || !costEl.value) return;

                                                    try {
                                                        const res = await fetch(`/api/vehicle-export/yard-jobs/${selectedJob.id}/materials`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                partName: nameEl.value,
                                                                quantity: qtyEl.value,
                                                                unitCost: costEl.value
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            // Refresh jobs to show new material
                                                            fetchJobs();
                                                            // Ideally update local state to avoid full refresh or close dialog
                                                            // For now, close dialog to refresh is easiest or re-fetch jobs and find this job
                                                            toast({ title: 'Material Added' });
                                                            nameEl.value = '';
                                                            costEl.value = '';
                                                            // Hacky update: close/reopen or trust fetchJobs updates the list behind modal? 
                                                            // The modal uses `selectedJob` state object. We need to update IT.
                                                            const newMaterial = await res.json();
                                                            setSelectedJob(prev => prev ? ({
                                                                ...prev,
                                                                materials: [...(prev.materials || []), newMaterial]
                                                            }) : null);
                                                        }
                                                    } catch (e) {
                                                        toast({ title: 'Error adding material', variant: 'destructive' });
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">

                        {selectedJob?.status === 'TODO' && (
                            <Button
                                onClick={() => updateJobStatus(selectedJob.id, 'IN_PROGRESS')}
                                disabled={processing}
                            >
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Play className="mr-2 h-4 w-4" />
                                Start Work
                            </Button>
                        )}
                        {selectedJob?.status === 'IN_PROGRESS' && (
                            <Button
                                onClick={() => updateJobStatus(selectedJob.id, 'DONE', completionNotes)}
                                disabled={processing}
                            >
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Complete
                            </Button>
                        )}
                        {selectedJob && (
                            <Link href={`/vehicle-export/inventory/${selectedJob.vehicle.id}`}>
                                <Button variant="outline">
                                    View Vehicle
                                </Button>
                            </Link>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
