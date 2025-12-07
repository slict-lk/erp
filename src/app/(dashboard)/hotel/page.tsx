'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hotel as HotelIcon, Plus, Users, Bed } from 'lucide-react';

export default function HotelPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const tenantId = 'tenant-1';
      const response = await fetch(`/api/hotel/rooms?tenantId=${tenantId}`);
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'OCCUPIED': return 'bg-red-100 text-red-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'CLEANING': return 'bg-blue-100 text-blue-800';
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Hotel Management</h1>
          <p className="text-muted-foreground mt-2">Manage rooms, bookings, and guests</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardHeader>
            </Card>
          ))
        ) : (
          rooms.map((room: any) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-2xl">Room {room.roomNumber}</CardTitle>
                  <HotelIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Badge variant="outline">{room.roomType}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      {room.bedType}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Max {room.maxOccupancy} guests
                    </div>
                    <div className="text-lg font-semibold text-primary">
                      ${room.basePrice}/night
                    </div>
                    {room.bookings?.length > 0 && (
                      <div className="text-muted-foreground">
                        {room.bookings.length} upcoming bookings
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {!loading && rooms.length === 0 && (
        <Card className="p-12 text-center">
          <HotelIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No rooms configured</h3>
          <p className="text-muted-foreground mb-4">Add your first hotel room</p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </Card>
      )}
    </div>
  );
}
