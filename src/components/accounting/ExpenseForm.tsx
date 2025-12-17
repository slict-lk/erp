'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const expenseSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
    category: z.string().min(1, 'Category is required'),
    expenseDate: z.string().min(1, 'Date is required'),
    status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).default('DRAFT'),
    employeeId: z.string().optional(),
    notes: z.string().optional(),
    receipt: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
    initialData?: Partial<ExpenseFormValues>;
    onSubmit: (data: ExpenseFormValues) => void;
    onCancel: () => void;
    employees?: { id: string; firstName: string; lastName: string }[];
}

export function ExpenseForm({ initialData, onSubmit, onCancel, employees }: ExpenseFormProps) {
    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: initialData?.description || '',
            amount: initialData?.amount || 0,
            category: initialData?.category || '',
            expenseDate: initialData?.expenseDate || new Date().toISOString().split('T')[0],
            status: initialData?.status || 'DRAFT',
            employeeId: initialData?.employeeId || undefined,
            notes: initialData?.notes || '',
            receipt: initialData?.receipt || '',
        },
    });

    const categories = [
        'Travel',
        'Office Supplies',
        'Meals & Entertainment',
        'Utilities',
        'Rent',
        'Marketing',
        'Software/SaaS',
        'Other',
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Monthly Internet Bill" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="expenseDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Employee (Optional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {employees?.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Additional details..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        {initialData ? 'Update Expense' : 'Create Expense'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
