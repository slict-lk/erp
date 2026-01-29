"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Users, Search, RefreshCw, Plus, MapPin, Phone, Mail, Package, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    country: string | null;
    address: string | null;
    createdAt: string;
    wallet?: { balance: number; currency: string };
    _count: { vehicles: number; bids: number };
}


const COUNTRIES = [
    'Sri Lanka', 'Botswana', 'South Africa', 'Kenya', 'Tanzania',
    'Uganda', 'Ghana', 'Nigeria', 'Zambia', 'Zimbabwe', 'Other'
];

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [creating, setCreating] = useState(false);
    const { toast } = useToast();

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        country: 'Sri Lanka',
        address: '',
    });

    const fetchCustomers = useCallback(async () => {
        try {
            setRefreshing(true);
            const res = await fetch('/api/vehicle-export/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleCreate = async () => {
        if (!newCustomer.name || !newCustomer.email) {
            toast({ title: 'Error', description: 'Name and email are required', variant: 'destructive' });
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/vehicle-export/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer),
            });

            if (res.ok) {
                toast({ title: 'Customer Created', description: 'New customer has been added' });
                setShowCreateDialog(false);
                setNewCustomer({
                    name: '',
                    email: '',
                    phone: '',
                    company: '',
                    country: 'Sri Lanka',
                    address: '',
                });
                fetchCustomers();
            } else {
                const error = await res.json();
                toast({ title: 'Error', description: error.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create customer', variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            customer.name.toLowerCase().includes(searchLower) ||
            customer.email.toLowerCase().includes(searchLower) ||
            customer.company?.toLowerCase().includes(searchLower) ||
            customer.country?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Export Customers
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                        Manage vehicle export customers
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchCustomers} disabled={refreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by name, email, company, country..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                    <CardDescription>{filteredCustomers.length} customers</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-500">
                            Loading customers...
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mb-2 opacity-50" />
                            <p>No customers found</p>
                            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                                Add First Customer
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Vehicles</TableHead>
                                            <TableHead className="text-right">Wallet Balance</TableHead>
                                            <TableHead>Bids</TableHead>

                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCustomers.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{customer.name}</p>
                                                        {customer.company && (
                                                            <p className="text-sm text-gray-500">{customer.company}</p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="text-sm flex items-center gap-1">
                                                            <Mail className="h-3 w-3 text-gray-400" />
                                                            {customer.email}
                                                        </p>
                                                        {customer.phone && (
                                                            <p className="text-sm flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-gray-400" />
                                                                {customer.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <MapPin className="h-3 w-3 text-gray-400" />
                                                        {customer.country || 'Unknown'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                        <Package className="h-3 w-3" />
                                                        {customer._count.vehicles}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-right">
                                                        {customer.wallet ? (
                                                            <span className={Number(customer.wallet.balance) < 1000 ? "text-yellow-600" : "text-green-600"}>
                                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: customer.wallet.currency || 'USD' }).format(Number(customer.wallet.balance))}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{customer._count.bids}</Badge>
                                                </TableCell>

                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="lg:hidden space-y-3">
                                {filteredCustomers.map((customer) => (
                                    <Card key={customer.id}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold">{customer.name}</p>
                                                    {customer.company && (
                                                        <p className="text-sm text-gray-500">{customer.company}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant="secondary">
                                                        <Package className="h-3 w-3 mr-1" />
                                                        {customer._count.vehicles}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                <p className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3" />
                                                    {customer.email}
                                                </p>
                                                {customer.phone && (
                                                    <p className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3" />
                                                        {customer.phone}
                                                    </p>
                                                )}
                                                <p className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3" />
                                                    {customer.country || 'Unknown'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Customer</DialogTitle>
                        <DialogDescription>Create a new export customer</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                placeholder="Full name"
                            />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={newCustomer.email}
                                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                value={newCustomer.phone}
                                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                placeholder="+94 77 123 4567"
                            />
                        </div>
                        <div>
                            <Label>Company</Label>
                            <Input
                                value={newCustomer.company}
                                onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                                placeholder="Company name"
                            />
                        </div>
                        <div>
                            <Label>Country</Label>
                            <Select
                                value={newCustomer.country}
                                onValueChange={(v) => setNewCustomer({ ...newCustomer, country: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COUNTRIES.map(country => (
                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={creating}>
                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
