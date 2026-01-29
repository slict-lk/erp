"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Gavel, RefreshCw, Trophy, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Bid {
    id: string;
    maxBudget: number | null;
    notes: string | null;
    proxyBidStatus: string;
    status: string;
    createdAt: string;
    customer: { id: string; name: string; country: string | null };
    vehicle: { id: string; stockNumber: string; make: string; model: string; year: number } | null;
}

const PROXY_STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    WON: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    LOST: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    OUTBID: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
};

export default function AuctioneerDashboardPage() {
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
    const [resultStatus, setResultStatus] = useState<string>('WON');
    const [winningPrice, setWinningPrice] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

    const fetchBids = useCallback(async () => {
        try {
            setRefreshing(true);
            // Fetch bids with proxyBidStatus = ACTIVE (approved for today's auction)
            const res = await fetch('/api/vehicle-export/bids?proxyBidStatus=ACTIVE');
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
    }, []);

    useEffect(() => {
        fetchBids();
    }, [fetchBids]);

    const recordResult = async () => {
        if (!selectedBid) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/vehicle-export/bids/${selectedBid.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proxyBidStatus: resultStatus,
                    winningPrice: resultStatus === 'WON' ? parseFloat(winningPrice) : undefined,
                }),
            });
            if (res.ok) {
                toast({
                    title: resultStatus === 'WON' ? '🎉 Bid Won!' : 'Result Recorded',
                    description: `Bid has been marked as ${resultStatus}.`,
                });
                fetchBids();
                setSelectedBid(null);
                setWinningPrice('');
            } else {
                toast({ title: 'Error', description: 'Failed to record result.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to record result.', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const activeCount = bids.length;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Gavel className="h-8 w-8 text-primary" />
                        Auctioneer Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Record auction results for today&apos;s active bids
                    </p>
                </div>
                <Button variant="outline" onClick={fetchBids} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Gavel className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                        <p className="text-sm text-gray-500">Active Bids Today</p>
                        <p className="text-3xl font-bold">{activeCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Bids Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Today&apos;s Active Bids</CardTitle>
                    <CardDescription>Bids approved for auction – record results here</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            Loading bids...
                        </div>
                    ) : bids.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Gavel className="h-12 w-12 mb-2 text-gray-300" />
                            <p className="text-gray-500">No active bids for today</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vehicle</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Max Budget</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bids.map((bid) => (
                                    <TableRow key={bid.id}>
                                        <TableCell>
                                            {bid.vehicle ? (
                                                <div>
                                                    <p className="font-medium">{bid.vehicle.stockNumber}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {bid.vehicle.year} {bid.vehicle.make} {bid.vehicle.model}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No vehicle</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{bid.customer.name}</p>
                                                <p className="text-sm text-gray-500">{bid.customer.country || 'Unknown'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold">
                                            {bid.maxBudget ? `¥${bid.maxBudget.toLocaleString()}` : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={PROXY_STATUS_COLORS[bid.proxyBidStatus]}>
                                                {bid.proxyBidStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => setSelectedBid(bid)}>
                                                Record Result
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Result Recording Dialog */}
            <Dialog open={!!selectedBid} onOpenChange={() => setSelectedBid(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Auction Result</DialogTitle>
                        <DialogDescription>
                            Enter the outcome of the auction for this bid.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBid && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Vehicle</span>
                                    <span className="font-medium">
                                        {selectedBid.vehicle?.stockNumber} – {selectedBid.vehicle?.make} {selectedBid.vehicle?.model}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Customer</span>
                                    <span>{selectedBid.customer.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Max Budget</span>
                                    <span className="font-bold">
                                        {selectedBid.maxBudget ? `¥${selectedBid.maxBudget.toLocaleString()}` : '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Result</label>
                                <Select value={resultStatus} onValueChange={setResultStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WON">🏆 WON</SelectItem>
                                        <SelectItem value="LOST">❌ LOST</SelectItem>
                                        <SelectItem value="OUTBID">💸 OUTBID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {resultStatus === 'WON' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Winning Price (¥)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 1500000"
                                        value={winningPrice}
                                        onChange={(e) => setWinningPrice(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            onClick={recordResult}
                            disabled={processing || (resultStatus === 'WON' && !winningPrice)}
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {resultStatus === 'WON' ? (
                                <>
                                    <Trophy className="mr-2 h-4 w-4" />
                                    Record Win
                                </>
                            ) : (
                                <>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Record Result
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
