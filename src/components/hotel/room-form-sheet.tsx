'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RoomImages } from './room-images';
import { AmenitiesSelector } from './amenities-selector';
import { Loader2, Save, Bed, Users, DollarSign, Image as ImageIcon, Sparkles } from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';

// Zod Schema
const roomSchema = z.object({
    roomNumber: z.string().min(1, 'Room number is required'),
    roomType: z.string().min(1, 'Room type is required'),
    floor: z.coerce.number().optional(),
    bedType: z.string().optional(),
    maxOccupancy: z.coerce.number().min(1).max(20),
    basePrice: z.coerce.number().min(0, 'Price must be positive'),
    status: z.string(),
    description: z.string().optional(),
    images: z.array(z.string()),
    amenities: z.array(z.string()),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface Room {
    id: string;
    roomNumber: string;
    roomType: string;
    floor?: number;
    bedType?: string;
    maxOccupancy: number;
    basePrice: number;
    status: string;
    description?: string;
    images: string[];
    amenities: string[];
}

interface RoomFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    room?: Room | null;
    tenantId: string;
    onSuccess: () => void;
}

const ROOM_TYPES = [
    { value: 'SINGLE', label: 'Single Room' },
    { value: 'DOUBLE', label: 'Double Room' },
    { value: 'TWIN', label: 'Twin Room' },
    { value: 'SUITE', label: 'Suite' },
    { value: 'DELUXE', label: 'Deluxe Room' },
    { value: 'PRESIDENTIAL', label: 'Presidential Suite' },
    { value: 'FAMILY', label: 'Family Room' },
    { value: 'PENTHOUSE', label: 'Penthouse' },
];

const BED_TYPES = [
    { value: 'SINGLE', label: 'Single Bed' },
    { value: 'DOUBLE', label: 'Double Bed' },
    { value: 'QUEEN', label: 'Queen Bed' },
    { value: 'KING', label: 'King Bed' },
    { value: 'TWIN', label: 'Twin Beds' },
    { value: 'BUNK', label: 'Bunk Beds' },
];

const ROOM_STATUS = [
    { value: 'AVAILABLE', label: 'Available', color: 'text-green-600' },
    { value: 'OCCUPIED', label: 'Occupied', color: 'text-red-600' },
    { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-yellow-600' },
    { value: 'CLEANING', label: 'Cleaning', color: 'text-blue-600' },
    { value: 'RESERVED', label: 'Reserved', color: 'text-purple-600' },
];

export function RoomFormSheet({
    open,
    onOpenChange,
    room,
    tenantId,
    onSuccess,
}: RoomFormSheetProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { settings } = useSettings();
    const currency = settings.currency;

    const isEditing = !!room;

    const form = useForm<RoomFormData>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            roomNumber: '',
            roomType: 'DELUXE',
            floor: undefined,
            bedType: 'QUEEN',
            maxOccupancy: 2,
            basePrice: 0,
            status: 'AVAILABLE',
            description: '',
            images: [],
            amenities: [],
        },
    });

    // Reset form when room changes
    useEffect(() => {
        if (room) {
            form.reset({
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                floor: room.floor,
                bedType: room.bedType || 'QUEEN',
                maxOccupancy: room.maxOccupancy,
                basePrice: room.basePrice,
                status: room.status,
                description: room.description || '',
                images: room.images || [],
                amenities: room.amenities || [],
            });
        } else {
            form.reset({
                roomNumber: '',
                roomType: 'DELUXE',
                floor: undefined,
                bedType: 'QUEEN',
                maxOccupancy: 2,
                basePrice: 0,
                status: 'AVAILABLE',
                description: '',
                images: [],
                amenities: [],
            });
        }
    }, [room, form]);

    const onSubmit = async (data: RoomFormData) => {
        setIsSaving(true);
        setError(null);

        try {
            const url = isEditing
                ? `/api/hotel/rooms/${room.id}`
                : '/api/hotel/rooms';

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    tenantId,
                }),
            });

            if (res.ok) {
                onSuccess();
                onOpenChange(false);
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to save room');
            }
        } catch (err) {
            setError('Failed to save room');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                <SheetHeader className="p-6 pb-0">
                    <SheetTitle className="text-2xl">
                        {isEditing ? `Edit Room ${room.roomNumber}` : 'Add New Room'}
                    </SheetTitle>
                    <SheetDescription>
                        {isEditing
                            ? 'Update room details, images, and amenities'
                            : 'Create a new room with all its details'
                        }
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-6">
                        {/* IMAGES SECTION */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">Room Images</h3>
                            </div>
                            <RoomImages
                                value={form.watch('images')}
                                onChange={(images) => form.setValue('images', images)}
                            />
                        </section>

                        <Separator />

                        {/* BASIC INFO */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Bed className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">Basic Information</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="roomNumber">Room Number *</Label>
                                    <Input
                                        id="roomNumber"
                                        {...form.register('roomNumber')}
                                        placeholder="e.g. 101, A-201"
                                    />
                                    {form.formState.errors.roomNumber && (
                                        <p className="text-sm text-destructive">{form.formState.errors.roomNumber.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="floor">Floor</Label>
                                    <Input
                                        id="floor"
                                        type="number"
                                        {...form.register('floor')}
                                        placeholder="e.g. 1, 2, 3"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Room Type *</Label>
                                    <Select
                                        value={form.watch('roomType')}
                                        onValueChange={(val) => form.setValue('roomType', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROOM_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={form.watch('status')}
                                        onValueChange={(val) => form.setValue('status', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROOM_STATUS.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    <span className={status.color}>{status.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* BED & CAPACITY */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">Bed & Capacity</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bed Type</Label>
                                    <Select
                                        value={form.watch('bedType')}
                                        onValueChange={(val) => form.setValue('bedType', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BED_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                                    <Input
                                        id="maxOccupancy"
                                        type="number"
                                        min={1}
                                        max={20}
                                        {...form.register('maxOccupancy')}
                                    />
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* DESCRIPTION */}
                        <section>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    {...form.register('description')}
                                    placeholder="Describe the room features, view, special amenities..."
                                    rows={4}
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* PRICING */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">Pricing</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="basePrice">Base Price (per night) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">{currency}</span>
                                    <Input
                                        id="basePrice"
                                        type="number"
                                        step="0.01"
                                        className="pl-12"
                                        {...form.register('basePrice')}
                                    />
                                </div>
                                {form.formState.errors.basePrice && (
                                    <p className="text-sm text-destructive">{form.formState.errors.basePrice.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Member rates (15% off) and promotional rates are calculated automatically.
                                </p>
                            </div>
                        </section>

                        <Separator />

                        {/* AMENITIES */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">Amenities</h3>
                            </div>
                            <AmenitiesSelector
                                value={form.watch('amenities')}
                                onChange={(amenities) => form.setValue('amenities', amenities)}
                            />
                        </section>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                                {error}
                            </div>
                        )}
                    </form>
                </ScrollArea>

                {/* Footer */}
                <div className="border-t p-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? 'Update Room' : 'Create Room'}
                            </>
                        )}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
