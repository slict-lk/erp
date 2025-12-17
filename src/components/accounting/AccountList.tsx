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
import { Edit, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Account {
    id: string;
    code: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
}

interface AccountListProps {
    accounts: Account[];
    onEdit: (account: Account) => void;
    onDelete: (id: string) => void;
}

export function AccountList({ accounts, onEdit, onDelete }: AccountListProps) {
    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            ASSET: 'bg-blue-100 text-blue-700',
            LIABILITY: 'bg-red-100 text-red-700',
            EQUITY: 'bg-purple-100 text-purple-700',
            REVENUE: 'bg-green-100 text-green-700',
            EXPENSE: 'bg-orange-100 text-orange-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {accounts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No accounts found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        accounts.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell className="font-medium">{account.code}</TableCell>
                                <TableCell>{account.name}</TableCell>
                                <TableCell>
                                    <Badge className={getTypeColor(account.type)} variant="secondary">
                                        {account.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                    {formatCurrency(account.balance)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(account)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => onDelete(account.id)}
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
