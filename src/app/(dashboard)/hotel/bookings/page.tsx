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
    Calendar,
    Search,
    Plus,
    Filter,
    MoreVertical,
    Loader2,
    ArrowRight,
    CheckCircle2,
    Clock,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/components/providers/SettingsProvider';
import { format } from 'date-fns';
import Link from 'next/link';

interface Booking {
    id: string;
    bookingNumber: string;
    guestName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'PENDING';
    totalAmount: number;
}

export default function HotelBookingsPage() {
    const { data: session } = useSession();
    const tenantId = (session?.user as any)?.tenantId;
    const { settings } = useSettings();
    const currency = settings.currency;

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (tenantId) {
            fetchBookings();
        }
    }, [tenantId]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/hotel/bookings?tenantId=${tenantId}`);
            if (res.ok) {
                setBookings(await res.json());
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Confirmed</Badge>;
            case 'CHECKED_IN':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Checked In</Badge>;
            case 'CHECKED_OUT':
                return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Checked Out</Badge>;
            case 'CANCELLED':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
                    <p className="text-muted-foreground">Manage room bookings and guest stays</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" /> New Booking
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Stays</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-xs text-muted-foreground">82% occupancy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">-1 from last week</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Booking List</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search guest, room or booking #"
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
                                <TableHead>Booking #</TableHead>
                                <TableHead>Guest</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Check In - Out</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No bookings found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <TableRow key={booking.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-mono text-xs font-medium">
                                            {booking.bookingNumber}
                                        </TableCell>
                                        <TableCell className="font-medium">{booking.guestName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">Room {booking.roomNumber}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span>{format(new Date(booking.checkIn), 'MMM d')}</span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                <span>{format(new Date(booking.checkOut), 'MMM d')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(booking.totalAmount, currency)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/hotel/bookings/${booking.id}/folio`}>
                                                <Button variant="ghost" size="sm">
                                                    View Folio
                                                </Button>
                                            </Link>
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
