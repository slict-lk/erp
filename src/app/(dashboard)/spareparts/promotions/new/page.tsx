"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Percent } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewPromotionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        code: '',
        type: 'CODE',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minimumPurchase: '',
        maximumDiscount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        targetType: 'ALL',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/spareparts/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    discountValue: parseFloat(formData.discountValue) || 0,
                    minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : null,
                    maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null,
                    startDate: new Date(formData.startDate),
                    endDate: formData.endDate ? new Date(formData.endDate) : null,
                    isActive: true,
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Success',
                    description: 'Promotion created successfully',
                });
                router.push('/spareparts/promotions');
            } else {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create promotion');
            }
        } catch (error: unknown) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to create promotion',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="p-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href="/spareparts/promotions">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Promotions
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Percent className="h-8 w-8 text-primary" />
                    Create Promotion
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Set up a new discount or promotional offer
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Promotion Details</CardTitle>
                        <CardDescription>Basic information about the promotion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Promotion Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="e.g., New Year Sale"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Promo Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                    placeholder="e.g., NEWYEAR2025"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Describe the promotion..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Discount Configuration</CardTitle>
                        <CardDescription>Set up how the discount works</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Promotion Type</Label>
                                <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CODE">Promo Code</SelectItem>
                                        <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                                        <SelectItem value="COUPON">Coupon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discountType">Discount Type</Label>
                                <Select value={formData.discountType} onValueChange={(v) => handleChange('discountType', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                        <SelectItem value="FIXED_AMOUNT">Fixed Amount (LKR)</SelectItem>
                                        <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="discountValue">
                                    Discount Value * {formData.discountType === 'PERCENTAGE' ? '(%)' : '(LKR)'}
                                </Label>
                                <Input
                                    id="discountValue"
                                    type="number"
                                    step="0.01"
                                    value={formData.discountValue}
                                    onChange={(e) => handleChange('discountValue', e.target.value)}
                                    placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '500'}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="minimumPurchase">Minimum Purchase (LKR)</Label>
                                <Input
                                    id="minimumPurchase"
                                    type="number"
                                    value={formData.minimumPurchase}
                                    onChange={(e) => handleChange('minimumPurchase', e.target.value)}
                                    placeholder="5000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maximumDiscount">Max Discount (LKR)</Label>
                                <Input
                                    id="maximumDiscount"
                                    type="number"
                                    value={formData.maximumDiscount}
                                    onChange={(e) => handleChange('maximumDiscount', e.target.value)}
                                    placeholder="10000"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Duration & Targeting</CardTitle>
                        <CardDescription>When and who can use this promotion</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="targetType">Target Audience</Label>
                            <Select value={formData.targetType} onValueChange={(v) => handleChange('targetType', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Customers</SelectItem>
                                    <SelectItem value="CUSTOMER_TYPE">Specific Customer Types</SelectItem>
                                    <SelectItem value="AUDIENCE">Customer Audience</SelectItem>
                                    <SelectItem value="PRODUCT">Specific Products</SelectItem>
                                    <SelectItem value="CATEGORY">Product Categories</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Link href="/spareparts/promotions">
                        <Button variant="outline" type="button">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Promotion
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
