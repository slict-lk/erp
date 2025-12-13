'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hotel as HotelIcon, Plus, Users, Bed, Calendar, Check, X, Trash2, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/components/providers/SettingsProvider';

// Types
interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  status: string;
  basePrice: number;
  maxOccupancy: number;
  bedType: string;
  amenities: string[];
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
  const { settings } = useSettings();
  const currency = settings.currency;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: 'DELUXE',
    basePrice: '',
    maxOccupancy: '2',
    bedType: 'QUEEN',
    description: '',
    imageUrl: '',
    tenantId: 'ceylon-paradise' // Matches frontend spec
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const tenantId = 'ceylon-paradise';
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

  const handleCreateRoom = async () => {
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          basePrice: parseFloat(formData.basePrice),
          maxOccupancy: parseInt(formData.maxOccupancy),
          amenities: ['Wifi', 'AC'], // Default for now
          description: formData.description || `A ${formData.roomType.toLowerCase()} room.`,
          images: formData.imageUrl ? [formData.imageUrl] : []
        }),
      });

      if (res.ok) {
        setIsAddRoomOpen(false);
        fetchData();
        // Reset form
        setFormData({ ...formData, roomNumber: '', basePrice: '' });
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      const res = await fetch(`/api/hotel/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Hotel Management</h1>
          <p className="text-muted-foreground mt-2">Manage properties, rooms, and reservations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>Refresh</Button>
          <Button onClick={() => setIsAddRoomOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Room
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
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

      {/* ADD ROOM DIALOG */}
      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a new room in the system.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Number</Label>
              <Input
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="col-span-3" placeholder="e.g. 101"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <Select onValueChange={(val) => setFormData({ ...formData, roomType: val })} defaultValue={formData.roomType}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="DOUBLE">Double</SelectItem>
                  <SelectItem value="SUITE">Suite</SelectItem>
                  <SelectItem value="DELUXE">Deluxe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Price</Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-2.5 text-gray-500">{currency}</span>
                <Input
                  type="number"
                  className="pl-8"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Capacity</Label>
              <Input
                type="number"
                value={formData.maxOccupancy}
                onChange={(e) => setFormData({ ...formData, maxOccupancy: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="e.g. Ocean view suite..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Image URL</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="col-span-3"
                placeholder="https://example.com/room.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoomOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRoom}>Create Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
