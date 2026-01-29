"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, RefreshCw, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    reference: string | null;
    notes: string | null;
    createdAt: string;
    wallet: {
        customer: { id: string; name: string; email: string };
    };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    CLEARED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function FinanceDashboardPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

    const fetchTransactions = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch('/api/vehicle-export/wallet/transactions?status=PENDING');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const verifyTransaction = async (txId: string, newStatus: 'CLEARED' | 'REJECTED') => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/vehicle-export/wallet/transactions/${txId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                toast({
                    title: newStatus === 'CLEARED' ? 'Deposit Verified' : 'Deposit Rejected',
                    description: `Transaction has been marked as ${newStatus.toLowerCase()}.`
                });
                fetchTransactions();
                setSelectedTx(null);
            } else {
                toast({ title: 'Error', description: 'Failed to update transaction.', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update transaction.', variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const pendingCount = transactions.length;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-primary" />
                        Finance Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Verify customer deposits and manage wallet transactions
                    </p>
                </div>
                <Button variant="outline" onClick={fetchTransactions} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <p className="text-sm text-gray-500">Pending Verification</p>
                        <p className="text-3xl font-bold">{pendingCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Pending Deposits</CardTitle>
                    <CardDescription>Review and verify customer deposit slips</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            Loading transactions...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <CheckCircle className="h-12 w-12 mb-2 text-green-400" />
                            <p className="text-gray-500">All deposits verified!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{tx.wallet?.customer?.name || 'Unknown'}</p>
                                                <p className="text-sm text-gray-500">{tx.wallet?.customer?.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold">
                                            ${Number(tx.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {tx.reference || '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={STATUS_COLORS[tx.status]}>{tx.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" onClick={() => setSelectedTx(tx)}>
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Deposit</DialogTitle>
                        <DialogDescription>
                            Review and approve or reject this deposit transaction.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTx && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Customer</span>
                                    <span className="font-medium">{selectedTx.wallet?.customer?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount</span>
                                    <span className="font-bold text-lg">${Number(selectedTx.amount).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Reference</span>
                                    <span className="font-mono">{selectedTx.reference || '—'}</span>
                                </div>
                                {selectedTx.notes && (
                                    <div>
                                        <span className="text-gray-500">Notes</span>
                                        <p className="mt-1 text-sm">{selectedTx.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="destructive"
                            onClick={() => selectedTx && verifyTransaction(selectedTx.id, 'REJECTED')}
                            disabled={processing}
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                        </Button>
                        <Button
                            onClick={() => selectedTx && verifyTransaction(selectedTx.id, 'CLEARED')}
                            disabled={processing}
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verify & Clear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
