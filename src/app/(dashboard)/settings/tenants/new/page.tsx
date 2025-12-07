
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function NewTenantPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        subdomain: '',
        plan: 'STARTER',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate subdomain from company name if subdomain is empty
        if (name === 'companyName' && !formData.subdomain) {
            const generated = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            setFormData(prev => ({ ...prev, subdomain: generated }));
        }
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, plan: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to create tenant');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/settings/tenants');
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Tenant Created Successfully!</h2>
                <p className="text-gray-600 mt-2">Redirecting to tenant list...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/settings/tenants">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Tenant</h1>
                    <p className="text-gray-600">Set up a new organization and admin account</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>Basic information about the tenant organization</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tenant Name (Internal)</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="e.g. Acme Corp Tenant"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name (Public)</Label>
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    placeholder="e.g. Acme Corporation"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subdomain">Subdomain</Label>
                                <div className="flex items-center">
                                    <Input
                                        id="subdomain"
                                        name="subdomain"
                                        placeholder="acme"
                                        value={formData.subdomain}
                                        onChange={handleChange}
                                        className="rounded-r-none"
                                        required
                                    />
                                    <div className="bg-gray-100 border border-l-0 border-gray-300 px-3 py-2 rounded-r-md text-gray-500 text-sm">
                                        .erp.slict.lk
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Contact Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="contact@acme.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan">Subscription Plan</Label>
                                <Select value={formData.plan} onValueChange={handleSelectChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STARTER">Starter</SelectItem>
                                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Initial Admin User</CardTitle>
                            <CardDescription>Create the first administrator for this tenant</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="adminName">Admin Name</Label>
                                <Input
                                    id="adminName"
                                    name="adminName"
                                    placeholder="John Doe"
                                    value={formData.adminName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adminEmail">Admin Email</Label>
                                <Input
                                    id="adminEmail"
                                    name="adminEmail"
                                    type="email"
                                    placeholder="admin@acme.com"
                                    value={formData.adminEmail}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="adminPassword">Initial Password</Label>
                                <Input
                                    id="adminPassword"
                                    name="adminPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.adminPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href="/settings/tenants">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Tenant'
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
