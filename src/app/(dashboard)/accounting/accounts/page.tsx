'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, Search, TrendingUp, FileText } from 'lucide-react';

interface Account {
    id: string;
    name: string;
    code: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    balance: number;
    currency: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounting/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const getTypeColor = (type: string) => {
        const colors = {
            ASSET: 'bg-blue-100 text-blue-700',
            LIABILITY: 'bg-red-100 text-red-700',
            EQUITY: 'bg-purple-100 text-purple-700',
            REVENUE: 'bg-green-100 text-green-700',
            EXPENSE: 'bg-orange-100 text-orange-700',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    };

    const stats = {
        totalAssets: accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0),
        totalLiabilities: accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0),
        totalEquity: accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0),
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
                    <p className="text-gray-600">Manage your accounting accounts</p>
                </div>
                <Button>
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
                        <Input placeholder="Search accounts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {accounts.map((account) => (
                            <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{account.name}</h3>
                                            <Badge className={getTypeColor(account.type)}>{account.type}</Badge>
                                            {account.status === 'INACTIVE' && <Badge variant="outline">INACTIVE</Badge>}
                                        </div>
                                        <p className="text-sm text-gray-500">Code: {account.code}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">{account.currency} {account.balance.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
