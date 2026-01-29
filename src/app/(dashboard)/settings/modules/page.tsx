'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
    Package, Plus, X, Clock, CheckCircle, XCircle,
    Loader2, Ship, Store, Users, Building2, Heart,
    Factory, Truck, Utensils, Hotel, FileText, BarChart3
} from 'lucide-react';

// Available modules configuration
const AVAILABLE_MODULES = [
    { id: 'vehicle-export', name: 'Vehicle Export', icon: Ship, description: 'Japanese car export business' },
    { id: 'spareparts', name: 'Spare Parts Shop', icon: Store, description: 'Auto parts retail & POS' },
    { id: 'real-estate', name: 'Real Estate', icon: Building2, description: 'Property management' },
    { id: 'healthcare', name: 'Healthcare', icon: Heart, description: 'Hospital & clinic management' },
    { id: 'manufacturing', name: 'Manufacturing', icon: Factory, description: 'Production & BOM' },
    { id: 'purchasing', name: 'Purchasing', icon: Truck, description: 'Vendor & purchase orders' },
    { id: 'restaurant', name: 'Restaurant', icon: Utensils, description: 'POS & kitchen display' },
    { id: 'hotel', name: 'Hotel', icon: Hotel, description: 'Room booking & front desk' },
    { id: 'crm', name: 'CRM', icon: Users, description: 'Customer relationship' },
    { id: 'hr', name: 'HR', icon: Users, description: 'Human resources' },
    { id: 'reports', name: 'Reports', icon: BarChart3, description: 'Advanced analytics' },
];

interface ModuleRequest {
    id: string;
    moduleId: string;
    action: 'ADD' | 'REMOVE';
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    reason: string | null;
    adminNotes: string | null;
    createdAt: string;
    requestedBy: { name: string };
    processedBy: { name: string } | null;
}

export default function ModulesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [enabledModules, setEnabledModules] = useState<string[]>([]);
    const [requests, setRequests] = useState<ModuleRequest[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState('');
    const [requestAction, setRequestAction] = useState<'ADD' | 'REMOVE'>('ADD');
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/module-requests');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setEnabledModules(data.enabledModules || []);
            setRequests(data.requests || []);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load module data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!selectedModule) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/module-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: selectedModule, action: requestAction, reason }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit request');
            }

            toast({ title: 'Success', description: 'Module request submitted successfully' });
            setDialogOpen(false);
            setSelectedModule('');
            setReason('');
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async (id: string) => {
        try {
            const res = await fetch(`/api/module-requests/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to cancel');
            toast({ title: 'Cancelled', description: 'Request cancelled successfully' });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to cancel request', variant: 'destructive' });
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
            CANCELLED: 'bg-gray-100 text-gray-800',
        };
        return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
    };

    const getModuleInfo = (moduleId: string) => {
        return AVAILABLE_MODULES.find(m => m.id === moduleId) || { name: moduleId, icon: Package };
    };

    // Modules available to request (not enabled and no pending request)
    const availableToRequest = AVAILABLE_MODULES.filter(m =>
        !enabledModules.includes(m.id) &&
        !requests.some(r => r.moduleId === m.id && r.status === 'PENDING')
    );

    // Modules available to remove (enabled and no pending removal request)
    const availableToRemove = AVAILABLE_MODULES.filter(m =>
        enabledModules.includes(m.id) &&
        !requests.some(r => r.moduleId === m.id && r.action === 'REMOVE' && r.status === 'PENDING')
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Module Access</h1>
                    <p className="text-muted-foreground">Manage your organization's module access</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Request Module
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request Module Access</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Action</Label>
                                <Select value={requestAction} onValueChange={(v: 'ADD' | 'REMOVE') => setRequestAction(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADD">Add Module</SelectItem>
                                        <SelectItem value="REMOVE">Remove Module</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Module</Label>
                                <Select value={selectedModule} onValueChange={setSelectedModule}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a module" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(requestAction === 'ADD' ? availableToRequest : availableToRemove).map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                <div className="flex items-center gap-2">
                                                    <m.icon className="h-4 w-4" />
                                                    {m.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason (Optional)</Label>
                                <Textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Why do you need this module?"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmitRequest} disabled={!selectedModule || submitting}>
                                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Current Modules */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Enabled Modules
                    </CardTitle>
                    <CardDescription>Modules currently active for your organization</CardDescription>
                </CardHeader>
                <CardContent>
                    {enabledModules.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No modules enabled yet. Request access to get started.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {enabledModules.map(moduleId => {
                                const info = getModuleInfo(moduleId);
                                const Icon = info.icon || Package;
                                return (
                                    <div key={moduleId} className="flex items-center gap-3 p-4 rounded-lg border bg-green-50 dark:bg-green-950/20">
                                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                            <Icon className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{info.name}</p>
                                            <p className="text-xs text-muted-foreground">Active</p>
                                        </div>
                                        <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Request History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Request History
                    </CardTitle>
                    <CardDescription>Track your module access requests</CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No requests yet.</p>
                    ) : (
                        <div className="rounded-md border">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200">
                                    {requests.map(req => {
                                        const info = getModuleInfo(req.moduleId);
                                        return (
                                            <tr key={req.id}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <info.icon className="h-4 w-4 text-gray-500" />
                                                        {info.name}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <Badge variant={req.action === 'ADD' ? 'default' : 'destructive'}>
                                                        {req.action}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(req.status)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                                                    {req.adminNotes || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    {req.status === 'PENDING' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCancelRequest(req.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
