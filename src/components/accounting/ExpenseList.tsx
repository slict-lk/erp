'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Receipt, Calendar, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
    status: string;
    employee?: {
        firstName: string;
        lastName: string;
    } | null;
}

interface ExpenseListProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            APPROVED: 'bg-green-100 text-green-700',
            PENDING: 'bg-orange-100 text-orange-700',
            REJECTED: 'bg-red-100 text-red-700',
            DRAFT: 'bg-gray-100 text-gray-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                No expenses found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell className="whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        {new Date(expense.expenseDate).toLocaleDateString()}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-red-500" />
                                        {expense.description}
                                    </div>
                                </TableCell>
                                <TableCell>{expense.category}</TableCell>
                                <TableCell>
                                    {expense.employee ? (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {expense.employee.firstName} {expense.employee.lastName}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(expense.status)} variant="secondary">
                                        {expense.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-bold text-red-600">
                                    {formatCurrency(expense.amount)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(expense)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => onDelete(expense.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
