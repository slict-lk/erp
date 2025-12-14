'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hotel as HotelIcon, Plus, Users, Bed, Check, Trash2, Edit, Settings, Loader2, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/components/providers/SettingsProvider';
import { RoomFormSheet } from '@/components/hotel/room-form-sheet';
import { useTranslations } from 'next-intl';

// Types
interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  floor?: number;
  status: string;
  basePrice: number;
  maxOccupancy: number;
  bedType?: string;
  amenities: string[];
  images: string[];
  description?: string;
  bookings: any[];
}

interface Booking {
  id: string;
  bookingNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  room: Room;
}

export default function HotelPage() {
  const t = useTranslations('hotel');
  const tc = useTranslations('common');
  const { data: session, status: sessionStatus } = useSession();
  const tenantId = (session?.user as any)?.tenantId;

  const { settings } = useSettings();
  const currency = settings.currency;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet States
  const [isRoomSheetOpen, setIsRoomSheetOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [tenantSubdomain, setTenantSubdomain] = useState<string | null>(null);

  // Fetch tenant subdomain
  useEffect(() => {
    if (tenantId) {
      fetchTenantSubdomain();
    }
  }, [tenantId]);

  const fetchTenantSubdomain = async () => {
    try {
      const res = await fetch(`/api/tenant?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setTenantSubdomain(data.subdomain);
      }
    } catch (error) {
      console.error('Failed to fetch tenant subdomain:', error);
    }
  };

  // Generate frontend URL based on environment
  const getFrontendUrl = () => {
    if (!tenantSubdomain) return null;

    const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocal) {
      // Local development: use Live Server URL with subdomain param
      return `http://127.0.0.1:5500/hotel/index.html?subdomain=${tenantSubdomain}`;
    } else {
      // Production: use subdomain-based URL
      return `https://${tenantSubdomain}.hotels.slict.lk/`;
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    if (!tenantId) return;

    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`/api/hotel/rooms?tenantId=${tenantId}`),
        fetch(`/api/hotel/bookings?tenantId=${tenantId}`)
      ]);

      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());

    } catch (error) {
      console.error('Failed to fetch hotel data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while session is loading
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No tenant found. Please contact your administrator.
      </div>
    );
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const res = await fetch(`/api/hotel/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomSheetOpen(true);
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsRoomSheetOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'OCCUPIED': return 'bg-red-100 text-red-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'CHECKED_IN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalRooms: rooms.length,
    occupied: rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RESERVED').length,
    available: rooms.filter(r => r.status === 'AVAILABLE').length,
    revenue: bookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {tenantSubdomain && (
            <Button
              variant="outline"
              onClick={() => window.open(getFrontendUrl() || '', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" /> View Website
            </Button>
          )}
          <Button variant="outline" onClick={fetchData}>{tc('refresh')}</Button>
          <Button variant="outline" asChild>
            <a href="/hotel/branches">
              <HotelIcon className="mr-2 h-4 w-4" /> Branches
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/hotel/settings">
              <Settings className="mr-2 h-4 w-4" /> {t('settings')}
            </a>
          </Button>
          <Button onClick={handleAddRoom}>
            <Plus className="mr-2 h-4 w-4" /> {t('addRoom')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="rooms">{t('rooms')}</TabsTrigger>
          <TabsTrigger value="bookings">{t('bookings')}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <span className="text-muted-foreground">{currency}</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                <HotelIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRooms}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.occupied}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.available}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ROOMS TAB */}
        <TabsContent value="rooms">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow relative group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Room {room.roomNumber}</CardTitle>
                    <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-foreground">{room.roomType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span className="font-medium text-foreground">{formatCurrency(room.basePrice)}/night</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-3 w-3" /> {room.maxOccupancy} Guests
                      <span className="text-gray-300">|</span>
                      <Bed className="h-3 w-3" /> {room.bedType}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditRoom(room)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDeleteRoom(room.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {rooms.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No rooms found. Create one to get started.
              </div>
            )}
          </div>
        </TabsContent>

        {/* BOOKINGS TAB */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Managed reservations from all sources.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-sm">{booking.bookingNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.guestName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {booking.room ? `Room ${booking.room.roomNumber}` : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                          {formatCurrency(booking.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bookings.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">No bookings found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ROOM FORM SHEET */}
      <RoomFormSheet
        open={isRoomSheetOpen}
        onOpenChange={setIsRoomSheetOpen}
        room={selectedRoom}
        tenantId={tenantId}
        onSuccess={fetchData}
      />
    </div>
  );
}
