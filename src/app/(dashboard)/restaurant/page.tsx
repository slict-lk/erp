'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Utensils, Plus, Users, Clock } from 'lucide-react';

export default function RestaurantPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const tenantId = 'tenant-1';
      const response = await fetch(`/api/restaurant/tables?tenantId=${tenantId}`);
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'OCCUPIED': return 'bg-red-100 text-red-800';
      case 'RESERVED': return 'bg-yellow-100 text-yellow-800';
      case 'MAINTENANCE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Management</h1>
          <p className="text-muted-foreground mt-2">Manage tables, reservations, and orders</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Table
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
          tables.map((table: any) => (
            <Card key={table.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Table {table.tableNumber}</CardTitle>
                  <Utensils className="h-5 w-5 text-muted-foreground" />
                </div>
                <Badge className={getStatusColor(table.status)}>
                  {table.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Capacity: {table.capacity}
                  </div>
                  {table.location && (
                    <div className="text-muted-foreground">
                      Location: {table.location}
                    </div>
                  )}
                  {table.reservations?.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {table.reservations.length} upcoming reservations
                    </div>
                  )}
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

      {!loading && tables.length === 0 && (
        <Card className="p-12 text-center">
          <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tables configured</h3>
          <p className="text-muted-foreground mb-4">Add your first restaurant table</p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        </Card>
      )}
    </div>
  );
}
