'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface RoomFormProps {
  room?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export function RoomForm({ room, onSubmit, onCancel }: RoomFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: room?.roomNumber || '',
    roomType: room?.roomType || 'STANDARD',
    floor: room?.floor || 1,
    bedType: room?.bedType || 'Queen',
    maxOccupancy: room?.maxOccupancy || 2,
    amenities: room?.amenities?.join(', ') || '',
    basePrice: room?.basePrice || 100,
    status: room?.status || 'AVAILABLE',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        amenities: formData.amenities
          .split(',')
          .map((amenity: string) => amenity.trim())
          .filter((amenity: string) => Boolean(amenity)),
      };
      await onSubmit(submitData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{room ? 'Edit Room' : 'Add New Room'}</CardTitle>
          <CardDescription>
            {room ? 'Update room information' : 'Add a new room to your hotel inventory'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                value={formData.roomNumber}
                onChange={(e) => handleChange('roomNumber', e.target.value)}
                placeholder="101, 201A, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor *</Label>
              <Input
                id="floor"
                type="number"
                min="0"
                max="100"
                value={formData.floor}
                onChange={(e) => handleChange('floor', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomType">Room Type *</Label>
              <Select value={formData.roomType} onValueChange={(value) => handleChange('roomType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="DELUXE">Deluxe</SelectItem>
                  <SelectItem value="SUITE">Suite</SelectItem>
                  <SelectItem value="PRESIDENTIAL">Presidential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedType">Bed Type *</Label>
              <Select value={formData.bedType} onValueChange={(value) => handleChange('bedType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Twin">Twin</SelectItem>
                  <SelectItem value="Queen">Queen</SelectItem>
                  <SelectItem value="King">King</SelectItem>
                  <SelectItem value="Double Queen">Double Queen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOccupancy">Maximum Occupancy *</Label>
            <Input
              id="maxOccupancy"
              type="number"
              min="1"
              max="10"
              value={formData.maxOccupancy}
              onChange={(e) => handleChange('maxOccupancy', parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities (comma-separated)</Label>
            <Textarea
              id="amenities"
              value={formData.amenities}
              onChange={(e) => handleChange('amenities', e.target.value)}
              placeholder="WiFi, TV, Mini Bar, Balcony, etc."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="basePrice">Base Price per Night (USD) *</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice}
              onChange={(e) => handleChange('basePrice', parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="CLEANING">Cleaning</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : room ? 'Update Room' : 'Add Room'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
