'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import { ExpenseList } from '@/components/accounting/ExpenseList';
import { ExpenseForm } from '@/components/accounting/ExpenseForm';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    employee?: {
        firstName: string;
        lastName: string;
    } | null;
}

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
        fetchEmployees();
    }, []);

    const fetchExpenses = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/accounting/expenses');
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/hr/employees');
            if (res.ok) {
                const data = await res.json();
                setEmployees(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    };

    const handleCreateExpense = async (data: any) => {
        try {
            const res = await fetch('/api/accounting/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast.success('Expense created successfully');
                fetchExpenses();
                setViewMode('list');
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to create expense');
            }
        } catch (error) {
            console.error('Error creating expense:', error);
            toast.error('An error occurred');
        }
    };

    const handleUpdateExpense = async (data: any) => {
        if (!selectedExpense) return;
        try {
            const res = await fetch(`/api/accounting/expenses/${selectedExpense.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toast.success('Expense updated successfully');
                fetchExpenses();
                setViewMode('list');
                setSelectedExpense(null);
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to update expense');
            }
        } catch (error) {
            console.error('Error updating expense:', error);
            toast.error('An error occurred');
        }
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            const res = await fetch(`/api/accounting/expenses/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Expense deleted successfully');
                fetchExpenses();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to delete expense');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('An error occurred');
        }
    };

    const filteredExpenses = expenses.filter(exp =>
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        pending: expenses.filter(e => e.status === 'PENDING').length,
        approved: expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0),
    };

    if (viewMode !== 'list') {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {viewMode === 'create' ? 'New Expense' : 'Edit Expense'}
                    </h1>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <ExpenseForm
                            initialData={selectedExpense ? {
                                ...selectedExpense,
                                expenseDate: selectedExpense.expenseDate.split('T')[0]
                            } : undefined}
                            employees={employees}
                            onSubmit={viewMode === 'create' ? handleCreateExpense : handleUpdateExpense}
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
                    <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-600">Track and manage company expenses</p>
                </div>
                <Button onClick={() => setViewMode('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Expense
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div>
                            <p className="text-sm text-gray-600">Total Expenses</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.total)}</p>
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
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.approved)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search expenses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Expense List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading expenses...</div>
                    ) : (
                        <ExpenseList
                            expenses={filteredExpenses}
                            onEdit={(exp) => {
                                setSelectedExpense(exp as Expense);
                                setViewMode('edit');
                            }}
                            onDelete={handleDeleteExpense}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

