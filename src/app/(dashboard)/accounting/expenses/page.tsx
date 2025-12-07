'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Receipt, Plus, Search, Calendar, DollarSign } from 'lucide-react';

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedBy: string;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/accounting/expenses');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
        }
    };

    const stats = {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        pending: expenses.filter(e => e.status === 'PENDING').length,
        approved: expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0),
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-600">Track and manage company expenses</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Expense
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">₹{stats.total.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Approved</p>
                            <p className="text-2xl font-bold text-green-600">₹{stats.approved.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                {expenses.map((expense) => (
                    <Card key={expense.id}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <Receipt className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                                            <Badge variant={expense.status === 'APPROVED' ? 'default' : expense.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                                {expense.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>{expense.category}</span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(expense.date).toLocaleDateString()}
                                            </span>
                                            <span>by {expense.submittedBy}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-red-600">₹{expense.amount.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
