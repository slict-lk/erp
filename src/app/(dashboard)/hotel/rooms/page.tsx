"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Bed, Users, Plus, Edit, Trash, Check, X,
    Search, Filter, MoreHorizontal, Settings,
    Copy, ArrowRight, LayoutGrid, List
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Types
interface RoomType {
    id: string;
    name: string;
    description?: string;
    basePrice: number;
    maxOccupancy: number;
    amenities: string[];
    _count?: { rooms: number };
}

interface HotelRoom {
    id: string;
    roomNumber: string;
    status: string; // The Prisma Enum
    floor: number;
    type?: RoomType;
    roomTypeId?: string;
    roomType?: string;
}

export default function RoomManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("types");

    // Data State
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [rooms, setRooms] = useState<HotelRoom[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // Form State (Type)
    const [typeName, setTypeName] = useState("");
    const [typePrice, setTypePrice] = useState("");
    const [typeOccupancy, setTypeOccupancy] = useState("2");
    const [typeDesc, setTypeDesc] = useState("");
    const [typeAmenities, setTypeAmenities] = useState("");

    // Form State (Room)
    const [roomNumber, setRoomNumber] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState("");
    const [roomFloor, setRoomFloor] = useState("1");

    const tenantId = session?.user?.tenantId;

    // Fetch Data
    const fetchData = async () => {
        if (!tenantId) return;
        setLoading(true);
        try {
            const [typesRes, roomsRes] = await Promise.all([
                fetch(`/api/hotel/room-types?tenantId=${tenantId}`),
                fetch(`/api/hotel/rooms?tenantId=${tenantId}`)
            ]);

            if (typesRes.ok) setRoomTypes(await typesRes.json());
            if (roomsRes.ok) setRooms(await roomsRes.json());

        } catch (error) {
            toast.error("Failed to load hotel data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user?.tenantId) {
            fetchData();
        }
    }, [session?.user?.tenantId]);

    // Handlers
    const handleSaveType = async () => {
        if (!tenantId) return;
        try {
            const payload = {
                tenantId,
                name: typeName,
                basePrice: parseFloat(typePrice),
                maxOccupancy: parseInt(typeOccupancy),
                description: typeDesc,
                amenities: typeAmenities.split(',').map(s => s.trim()).filter(Boolean),
            };

            const res = await fetch('/api/hotel/room-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success("Room Type Saved");
            setIsTypeModalOpen(false);
            resetTypeForm();
            fetchData(); // Refresh
        } catch (e) {
            toast.error("Error saving room type");
        }
    };

    const handleSaveRoom = async () => {
        if (!tenantId) return;
        try {
            const payload = {
                tenantId,
                roomNumber,
                roomTypeId: selectedTypeId,
                floor: parseInt(roomFloor),
            };

            const res = await fetch('/api/hotel/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success("Room Created");
            setIsRoomModalOpen(false);
            setRoomNumber("");
            fetchData();
        } catch (e) {
            toast.error("Error saving room");
        }
    };

    const resetTypeForm = () => {
        setTypeName("");
        setTypePrice("");
        setTypeDesc("");
        setTypeAmenities("");
    };

    if (loading && !rooms.length && !roomTypes.length) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
                    <p className="text-muted-foreground mt-1">Manage your hotel inventory and room configurations.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="types" className="gap-2">
                        <LayoutGrid className="h-4 w-4" /> Room Types
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="gap-2">
                        <List className="h-4 w-4" /> Room Inventory
                    </TabsTrigger>
                </TabsList>

                {/* ROOM TYPES TAB */}
                <TabsContent value="types" className="space-y-6">
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Defined Room Categories</h3>
                            <p className="text-sm text-muted-foreground">Standard, Deluxe, Suites, etc.</p>
                        </div>
                        <Button onClick={() => { resetTypeForm(); setIsTypeModalOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Add Room Type
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roomTypes.map(type => (
                            <Card key={type.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-400">
                                    <div className="flex flex-col items-center">
                                        <Bed className="h-8 w-8 mb-2" />
                                        <span className="text-sm">No Image</span>
                                    </div>
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xl">{type.name}</CardTitle>
                                        <Badge variant="secondary">${type.basePrice}</Badge>
                                    </div>
                                    <CardDescription className="line-clamp-2">{type.description || "No description"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" /> {type.maxOccupancy} Guests
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Bed className="h-4 w-4" /> {type._count?.rooms || 0} Rooms
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {!roomTypes.length && (
                            <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                No room types defined yet. Create one to get started.
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* INVENTORY TAB */}
                <TabsContent value="inventory" className="space-y-6">
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Physical Rooms</h3>
                            <p className="text-sm text-muted-foreground">Manage status and assignments</p>
                        </div>
                        <Button onClick={() => setIsRoomModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Room
                        </Button>
                    </div>

                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Floor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rooms.map(room => (
                                    <TableRow key={room.id}>
                                        <TableCell className="font-medium">{room.roomNumber}</TableCell>
                                        <TableCell>
                                            {room.type?.name ? (
                                                <Badge variant="outline">{room.type.name}</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="opacity-50">{room.roomType || 'Unknown'}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{room.floor}</TableCell>
                                        <TableCell>
                                            <Badge variant={room.status === 'AVAILABLE' ? 'default' : 'destructive'}>
                                                {room.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!rooms.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No rooms found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* CREATE TYPE DIALOG */}
            <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create Room Type</DialogTitle>
                        <DialogDescription>Define a new category of rooms (e.g. Deluxe, Suite).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Name</Label>
                            <Input className="col-span-3" value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="e.g. Deluxe Ocean View" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Base Price</Label>
                            <Input className="col-span-3" type="number" value={typePrice} onChange={e => setTypePrice(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Occupancy</Label>
                            <Select value={typeOccupancy} onValueChange={setTypeOccupancy}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Person</SelectItem>
                                    <SelectItem value="2">2 People</SelectItem>
                                    <SelectItem value="3">3 People</SelectItem>
                                    <SelectItem value="4">4 People</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Amenities</Label>
                            <Textarea className="col-span-3" value={typeAmenities} onChange={e => setTypeAmenities(e.target.value)} placeholder="Wifi, TV, Jacuzzi (comma allocated)" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveType}>Save Room Type</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CREATE ROOM DIALOG */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Room</DialogTitle>
                        <DialogDescription>Add a physical room unit to your inventory.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Number</Label>
                            <Input className="col-span-3" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 101" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Floor</Label>
                            <Input className="col-span-3" type="number" value={roomFloor} onChange={e => setRoomFloor(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Type</Label>
                            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roomTypes.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                    {!roomTypes.length && <SelectItem value="none" disabled>No types available</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveRoom}>Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
