'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Home,
    Search,
    Plus,
    Filter,
    MapPin,
    Bed,
    Bath,
    Maximize,
    Loader2,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/components/providers/SettingsProvider';
import Link from 'next/link';

interface Property {
    id: string;
    title: string;
    propertyType: string;
    listingType: string;
    city: string;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    area: number | null;
    status: string;
}

export default function PropertiesListPage() {
    const { data: session } = useSession();
    const tenantId = (session?.user as any)?.tenantId;
    const { settings } = useSettings();
    const currency = settings.currency;

    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<Property[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (tenantId) {
            fetchProperties();
        }
    }, [tenantId]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/properties?tenantId=${tenantId}`);
            if (res.ok) {
                const result = await res.json();
                setProperties(result.data || result);
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Available</Badge>;
            case 'SOLD':
                return <Badge variant="secondary">Sold</Badge>;
            case 'RENTED':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Rented</Badge>;
            case 'PENDING':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredProperties = properties.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.propertyType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
                    <p className="text-muted-foreground">Manage your real estate listings and inventory</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Link href="/real-estate/dashboard/properties/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Property
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Property Inventory</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, city or type..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Features</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProperties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No properties found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProperties.map((property) => (
                                    <TableRow key={property.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            <div className="font-medium">{property.title}</div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                                {property.listingType}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{property.propertyType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                {property.city}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {property.bedrooms || 0}</span>
                                                <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {property.bathrooms || 0}</span>
                                                <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {property.area || 0} sqft</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(property.price, currency)}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/real-estate/properties/${property.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
