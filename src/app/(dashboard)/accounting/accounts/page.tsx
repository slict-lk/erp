'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import { AccountList } from '@/components/accounting/AccountList';
import { AccountForm } from '@/components/accounting/AccountForm';
import { toast } from 'sonner';

interface Account {
    id: string;
    name: string;
    code: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    balance: number;
    currency: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/accounting/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateAccount = async (data: any) => {
        try {
            const res = await fetch('/api/accounting/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast.success('Account created successfully');
                fetchAccounts();
                setViewMode('list');
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to create account');
            }
        } catch (error) {
            console.error('Error creating account:', error);
            toast.error('An error occurred');
        }
    };

    const handleUpdateAccount = async (data: any) => {
        if (!selectedAccount) return;
        try {
            const res = await fetch(`/api/accounting/accounts/${selectedAccount.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast.success('Account updated successfully');
                fetchAccounts();
                setViewMode('list');
                setSelectedAccount(null);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to update account');
            }
        } catch (error) {
            console.error('Error updating account:', error);
            toast.error('An error occurred');
        }
    };

    const handleDeleteAccount = async (id: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            const res = await fetch(`/api/accounting/accounts/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Account deleted successfully');
                fetchAccounts();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('An error occurred');
        }
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalAssets: accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0),
        totalLiabilities: accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0),
        totalEquity: accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0),
    };

    if (viewMode !== 'list') {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {viewMode === 'create' ? 'New Account' : 'Edit Account'}
                    </h1>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <AccountForm
                            initialData={selectedAccount || undefined}
                            accounts={accounts.filter(a => a.id !== selectedAccount?.id)}
                            onSubmit={viewMode === 'create' ? handleCreateAccount : handleUpdateAccount}
                            onCancel={() => setViewMode('list')}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
                    <p className="text-gray-600">Manage your accounting accounts</p>
                </div>
                <Button onClick={() => setViewMode('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Account
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Total Assets</p>
                            <p className="text-2xl font-bold text-blue-600">₹{stats.totalAssets.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Total Liabilities</p>
                            <p className="text-2xl font-bold text-red-600">₹{stats.totalLiabilities.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Total Equity</p>
                            <p className="text-2xl font-bold text-purple-600">₹{stats.totalEquity.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading accounts...</div>
                    ) : (
                        <AccountList
                            accounts={filteredAccounts}
                            onEdit={(acc) => {
                                setSelectedAccount(acc as Account);
                                setViewMode('edit');
                            }}
                            onDelete={handleDeleteAccount}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

