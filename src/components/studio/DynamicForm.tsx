"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface DynamicField {
    id?: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'file' | 'json' | 'email' | 'url' | 'phone' | 'currency' | 'percentage' | 'richtext';
    required?: boolean;
    options?: string | string[];
    defaultValue?: any;
    placeholder?: string;
}

interface DynamicFormProps {
    fields: DynamicField[];
    defaultValues?: Record<string, any>;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
    submitLabel?: string;
    onCancel?: () => void;
}

// Generate Zod schema dynamically based on field configuration
function generateZodSchema(fields: DynamicField[]) {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    fields.forEach(field => {
        let validator: z.ZodTypeAny;

        switch (field.type) {
            case 'text':
            case 'select':
            case 'richtext':
                validator = z.string();
                if (field.required) {
                    validator = (validator as z.ZodString).min(1, `${field.label} is required`);
                } else {
                    validator = validator.optional().or(z.literal(''));
                }
                break;
            case 'email':
                validator = z.string().email('Invalid email address');
                if (!field.required) validator = validator.optional().or(z.literal(''));
                break;
            case 'url':
                validator = z.string().url('Invalid URL');
                if (!field.required) validator = validator.optional().or(z.literal(''));
                break;
            case 'phone':
                validator = z.string(); // Custom regex could be added
                if (!field.required) validator = validator.optional().or(z.literal(''));
                break;
            case 'number':
            case 'currency':
            case 'percentage':
                validator = z.coerce.number();
                if (!field.required) {
                    validator = validator.optional();
                }
                break;
            case 'boolean':
                validator = z.boolean().default(false);
                break;
            case 'json':
                validator = z.string().optional();
                break;
            case 'date':
                validator = z.string().or(z.date());
                if (!field.required) {
                    validator = validator.optional();
                }
                break;
            default:
                validator = z.any();
        }

        schemaShape[field.name] = validator;
    });

    return z.object(schemaShape);
}

export function DynamicForm({ fields, defaultValues = {}, onSubmit, isLoading = false, submitLabel = "Save", onCancel }: DynamicFormProps) {

    const formSchema = generateZodSchema(fields);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: fields.reduce((acc, field) => {
            acc[field.name] = defaultValues[field.name] ?? (field.type === 'boolean' ? false : '');
            return acc;
        }, {} as any)
    });

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        onSubmit(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fields.map((field) => (
                        <FormField
                            key={field.name}
                            control={form.control}
                            name={field.name}
                            render={({ field: formField }) => {
                                return (
                                    <FormItem className={field.type === 'boolean' ? 'flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm h-full' : ''}>

                                        {field.type !== 'boolean' && (
                                            <FormLabel>
                                                {field.label} {field.required && <span className="text-red-500">*</span>}
                                            </FormLabel>
                                        )}

                                        <FormControl>
                                            {/* Field Type Routing */}
                                            {field.type === 'text' || field.type === 'email' || field.type === 'url' || field.type === 'phone' ? (
                                                <Input type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} {...formField} />
                                            ) : field.type === 'number' || field.type === 'currency' || field.type === 'percentage' ? (
                                                <div className="relative">
                                                    {field.type === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>}
                                                    <Input type="number" className={field.type === 'currency' ? 'pl-7' : ''} placeholder="0" {...formField} />
                                                    {field.type === 'percentage' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>}
                                                </div>
                                            ) : field.type === 'boolean' ? (
                                                <div className="flex items-center gap-3 w-full">
                                                    <Checkbox
                                                        checked={formField.value}
                                                        onCheckedChange={formField.onChange}
                                                    />
                                                    <div className="space-y-1 leading-none">
                                                        <FormLabel>{field.label}</FormLabel>
                                                    </div>
                                                </div>
                                            ) : field.type === 'select' ? (
                                                <Select onValueChange={formField.onChange} defaultValue={String(formField.value || '')}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={`Select ${field.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(Array.isArray(field.options) ? field.options : (typeof field.options === 'string' ? field.options.split(',').map(s => s.trim()) : [])).map((opt: string) => (
                                                            <SelectItem key={opt} value={opt}>
                                                                {opt}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : field.type === 'json' || field.type === 'multiselect' || field.type === 'richtext' ? (
                                                <Textarea placeholder={field.placeholder || '...'} {...formField} />
                                            ) : field.type === 'date' ? (
                                                <Input type="datetime-local" {...formField} />
                                            ) : (
                                                <Input {...formField} />
                                            )}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    {onCancel && (
                        <Button variant="outline" type="button" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
