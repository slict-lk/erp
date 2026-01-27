"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Users, Search, RefreshCw, Check, X, ArrowRight, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Customer {
    id: string;
    name: string;
    email: string;
    country: string | null;
}

interface Bid {
    id: string;
    requestedMake: string | null;
    requestedModel: string | null;
    maxBudget: number | null;
    currency: string;
    notes: string | null;
    status: string;
    adminNotes: string | null;
    createdAt: string;
    customer: Customer;
    vehicle: { id: string; stockNumber: string; make: string; model: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    WON: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    LOST: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function formatCurrency(amount: number | null, currency: string = 'JPY'): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(dateStr));
}

export default function BidsPage() {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

    const fetchBids = useCallback(async () => {
        try {
            setRefreshing(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/vehicle-export/bids?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setBids(data.bids || []);
            }
        } catch (error) {
            console.error('Error fetching bids:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchBids();
    }, [fetchBids]);

    const handleApprove = async () => {
        if (!selectedBid) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/vehicle-export/bids/${selectedBid.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'APPROVED',
                    adminNotes: 'Approved by sales team',
                }),
            });
            if (res.ok) {
                toast({ title: 'Bid Approved', description: 'The bid has been approved and forwarded to auction team.' });
                fetchBids();
                setSelectedBid(null);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to approve bid', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedBid) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/vehicle-export/bids/${selectedBid.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'REJECTED',
                    adminNotes: 'Rejected by sales team',
                }),
            });
            if (res.ok) {
                toast({ title: 'Bid Rejected', description: 'The bid has been rejected.' });
                fetchBids();
                setSelectedBid(null);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to reject bid', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const filteredBids = bids.filter(bid => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            bid.customer.name.toLowerCase().includes(searchLower) ||
            bid.requestedMake?.toLowerCase().includes(searchLower) ||
            bid.requestedModel?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Customer Bids
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Manage incoming bid requests from website
                    </p>
                </div>
                <Button variant="outline" onClick={fetchBids} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by customer or vehicle..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="WON">Won</SelectItem>
                                <SelectItem value="LOST">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Bids Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Bid Requests</CardTitle>
                    <CardDescription>{filteredBids.length} bids found</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            Loading bids...
                        </div>
                    ) : filteredBids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mb-2 opacity-50" />
                            <p>No bids found</p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Requested Vehicle</TableHead>
                                            <TableHead className="text-right">Budget</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBids.map((bid) => (
                                            <TableRow key={bid.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{bid.customer.name}</p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {bid.customer.country || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {bid.requestedMake || bid.requestedModel ? (
                                                        <span>{bid.requestedMake} {bid.requestedModel}</span>
                                                    ) : (
                                                        <span className="text-gray-400">Any</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(bid.maxBudget, bid.currency)}
                                                </TableCell>
                                                <TableCell>{formatDate(bid.createdAt)}</TableCell>
                                                <TableCell>
                                                    <Badge className={STATUS_COLORS[bid.status] || ''}>
                                                        {bid.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedBid(bid)}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-3">
                                {filteredBids.map((bid) => (
                                    <Card key={bid.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedBid(bid)}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold">{bid.customer.name}</p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {bid.customer.country || 'Unknown'}
                                                    </p>
                                                </div>
                                                <Badge className={STATUS_COLORS[bid.status] || ''}>
                                                    {bid.status}
                                                </Badge>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                                <div>
                                                    <p className="text-xs text-gray-500">Requested</p>
                                                    <p className="font-medium">{bid.requestedMake} {bid.requestedModel || 'Any'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Budget</p>
                                                    <p className="font-semibold">{formatCurrency(bid.maxBudget, bid.currency)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Bid Detail Dialog */}
            <Dialog open={!!selectedBid} onOpenChange={() => setSelectedBid(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bid Details</DialogTitle>
                        <DialogDescription>Review and take action on this bid</DialogDescription>
                    </DialogHeader>
                    {selectedBid && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Customer</p>
                                    <p className="font-medium">{selectedBid.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Country</p>
                                    <p className="font-medium">{selectedBid.customer.country || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Requested</p>
                                    <p className="font-medium">{selectedBid.requestedMake} {selectedBid.requestedModel}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Budget</p>
                                    <p className="font-medium">{formatCurrency(selectedBid.maxBudget, selectedBid.currency)}</p>
                                </div>
                            </div>
                            {selectedBid.notes && (
                                <div>
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded mt-1">{selectedBid.notes}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Status:</span>
                                <Badge className={STATUS_COLORS[selectedBid.status] || ''}>
                                    {selectedBid.status}
                                </Badge>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        {selectedBid?.status === 'PENDING' && (
                            <>
                                <Button variant="outline" onClick={handleReject} disabled={processing}>
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button onClick={handleApprove} disabled={processing}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                            </>
                        )}
                        {selectedBid?.status === 'APPROVED' && (
                            <Link href={`/vehicle-export/auction/new?bidId=${selectedBid.id}`}>
                                <Button>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Create Vehicle
                                </Button>
                            </Link>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
