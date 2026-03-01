'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Search, Mail, Phone, Users, MapPin, PlusCircle, CheckCircle } from 'lucide-react';
import { useModuleAccess } from '@/hooks/useModulePermissions';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { canEdit } = useModuleAccess('inventory');

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/inventory/suppliers');
            if (res.ok) {
                setSuppliers(await res.json());
            } else {
                setError('Failed to load suppliers');
            }
        } catch (e: any) {
            setError(e.message || 'Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s =>
            s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [suppliers, searchTerm]);

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Procurement Partners</h1>
                    <p className="text-gray-500">Manage vendor relationships, supply chains, and contact directories.</p>
                </div>
                {canEdit && (
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Onboard Vendor
                    </Button>
                )}
            </div>

            <Card className="shadow-sm border-gray-100">
                <CardHeader className="bg-white/50 border-b border-gray-50 pb-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by vendor name, contact person, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 w-full bg-white border-gray-200"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="h-64 flex flex-col items-center justify-center space-y-4">
                            <p className="text-rose-500 font-medium">{error}</p>
                            <Button variant="outline" onClick={loadSuppliers}>Retry</Button>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto w-full">
                            <Table>
                                <TableHeader className="bg-gray-50/50">
                                    <TableRow>
                                        <TableHead className="w-[300px]">Vendor Enterprise</TableHead>
                                        <TableHead>Primary Contact</TableHead>
                                        <TableHead>Contact Details</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white">
                                    {filteredSuppliers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-48 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Building2 className="h-10 w-10 text-gray-300" />
                                                    <p>No vendors found matching your search.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredSuppliers.map((s) => (
                                        <TableRow key={s.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 rounded-lg shrink-0 border border-indigo-100">
                                                        <Building2 className="h-4 w-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors block">{s.name}</span>
                                                        {(s.address || s.city) && (
                                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {s.city || s.address}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium text-gray-700">{s.contactPerson || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {s.email && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail className="h-3.5 w-3.5 text-gray-400" /> {s.email}
                                                        </div>
                                                    )}
                                                    {s.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone className="h-3.5 w-3.5 text-gray-400" /> {s.phone}
                                                        </div>
                                                    )}
                                                    {!s.email && !s.phone && <span className="text-gray-400 italic">No contact info</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}>
                                                    {s.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                                                    {s.isActive ? 'Active Partner' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
