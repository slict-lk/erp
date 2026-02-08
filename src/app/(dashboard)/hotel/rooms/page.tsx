"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    Bed, Users, Plus, Edit, Trash,
    ChevronDown, ChevronRight, LayoutGrid, AlertCircle
} from "lucide-react";
import {
    Card
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RoomImages } from "@/components/hotel/room-images";

// Types
interface RoomType {
    id: string;
    name: string;
    description?: string;
    basePrice: number;
    maxOccupancy: number;
    amenities: string[];
    images: string[];
    rooms?: HotelRoom[];
    _count?: { rooms: number };
}

interface HotelRoom {
    id: string;
    roomNumber: string;
    status: string;
    floor: number;
    roomTypeId?: string;
}

export default function RoomManagementPage() {
    const { data: session } = useSession();
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    // Modal State
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [deleteAnalysis, setDeleteAnalysis] = useState<{ id: string, name: string } | null>(null);

    // Form State (Type)
    const [editingType, setEditingType] = useState<RoomType | null>(null);
    const [typeName, setTypeName] = useState("");
    const [typePrice, setTypePrice] = useState("");
    const [typeOccupancy, setTypeOccupancy] = useState("2");
    const [typeDesc, setTypeDesc] = useState("");
    const [typeAmenities, setTypeAmenities] = useState("");
    const [typeImages, setTypeImages] = useState<string[]>([]);

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
            const res = await fetch(`/api/hotel/room-types?tenantId=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setRoomTypes(data);
                if (data.length > 0 && expandedTypes.size === 0) {
                    setExpandedTypes(new Set([data[0].id]));
                }
            }
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
    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedTypes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedTypes(newSet);
    };

    const handleOpenAddRoom = (typeId: string) => {
        setSelectedTypeId(typeId);
        setIsRoomModalOpen(true);
    };

    const handleEditType = (type: RoomType) => {
        setEditingType(type);
        setTypeName(type.name);
        setTypePrice(type.basePrice.toString());
        setTypeOccupancy(type.maxOccupancy.toString());
        setTypeDesc(type.description || "");
        setTypeAmenities(type.amenities.join(', '));
        setTypeImages(type.images || []);
        setIsTypeModalOpen(true);
    };

    const handleDeleteTypeConfirm = async () => {
        if (!deleteAnalysis) return;
        try {
            const res = await fetch(`/api/hotel/room-types/${deleteAnalysis.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');

            toast.success("Category deleted");
            setDeleteAnalysis(null);
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

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
                images: typeImages,
            };

            const url = editingType
                ? `/api/hotel/room-types/${editingType.id}`
                : '/api/hotel/room-types';

            const method = editingType ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            toast.success(editingType ? "Category Updated" : "Category Created");
            setIsTypeModalOpen(false);
            resetTypeForm();
            fetchData();
        } catch (e) {
            toast.error("Error saving category");
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

            const newSet = new Set(expandedTypes);
            newSet.add(selectedTypeId);
            setExpandedTypes(newSet);

            fetchData();
        } catch (e) {
            toast.error("Error saving room");
        }
    };

    const resetTypeForm = () => {
        setEditingType(null);
        setTypeName("");
        setTypePrice("");
        setTypeDesc("");
        setTypeAmenities("");
        setTypeImages([]);
    };

    if (loading && !roomTypes.length) return <div className="p-8">Loading...</div>;

    return (
        <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
                    <p className="text-muted-foreground mt-1">Unified view for Categories and Inventory</p>
                </div>
                <Button onClick={() => { resetTypeForm(); setIsTypeModalOpen(true); }} size="lg">
                    <Plus className="mr-2 h-5 w-5" /> Add Room Category
                </Button>
            </div>

            <div className="space-y-6">
                {roomTypes.map(type => (
                    <Card key={type.id} className="overflow-hidden border-2 hover:border-primary/20 transition-all">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer bg-muted/30 hover:bg-muted/50"
                            onClick={() => toggleExpand(type.id)}
                        >
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="sm" className="bg-white/50">
                                    {expandedTypes.has(type.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                                {/* Thumbnail */}
                                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                    {type.images?.[0] ? (
                                        <img src={type.images[0]} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <Bed className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{type.name}</h3>
                                        <Badge variant="outline" className="text-base">${type.basePrice}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Max {type.maxOccupancy}</span>
                                        <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {type.rooms?.length || 0} Units</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleEditType(type); }}
                                >
                                    <Edit className="h-4 w-4 mr-1" /> Edit Type
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleOpenAddRoom(type.id); }}
                                    className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                                    variant="ghost"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Room
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteAnalysis({ id: type.id, name: type.name });
                                    }}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* EXPANDED CONTENT: ROOMS LIST */}
                        {expandedTypes.has(type.id) && (
                            <div className="border-t animate-in slide-in-from-top-2 duration-200">
                                <div className="p-4 bg-slate-50/50">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Number</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Floor</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {type.rooms?.map(room => (
                                                <TableRow key={room.id}>
                                                    <TableCell className="font-bold">{room.roomNumber}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={room.status === 'AVAILABLE' ? 'default' : 'secondary'} className={cn(
                                                            room.status === 'AVAILABLE' && "bg-green-100 text-green-700 hover:bg-green-200",
                                                            room.status === 'OCCUPIED' && "bg-red-100 text-red-700 hover:bg-red-200",
                                                            room.status === 'DIRTY' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                                                        )}>
                                                            {room.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{room.floor}</TableCell>
                                                    <TableCell className="text-right">
                                                        {/* Future: Edit Room Dialog */}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!type.rooms || type.rooms.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground border-dashed">
                                                        No rooms added to this category yet. Click "Add Room" to create one.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* CREATE/EDIT TYPE DIALOG */}
            <Dialog open={isTypeModalOpen} onOpenChange={setIsTypeModalOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingType ? "Edit Category" : "Create Room Category"}</DialogTitle>
                        <DialogDescription>Define the product details, images, and amenities.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {/* BASIC INFO */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="e.g. Deluxe Ocean View" />
                            </div>
                            <div className="space-y-2">
                                <Label>Base Price</Label>
                                <Input type="number" value={typePrice} onChange={e => setTypePrice(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Occupancy</Label>
                                <Select value={typeOccupancy} onValueChange={setTypeOccupancy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Person</SelectItem>
                                        <SelectItem value="2">2 People</SelectItem>
                                        <SelectItem value="3">3 People</SelectItem>
                                        <SelectItem value="4">4 People</SelectItem>
                                        <SelectItem value="5">5 People</SelectItem>
                                        <SelectItem value="6">6 People</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={typeDesc} onChange={e => setTypeDesc(e.target.value)} placeholder="Describe the room features..." />
                        </div>

                        {/* AMENITIES */}
                        <div className="space-y-2">
                            <Label>Amenities (comma separated)</Label>
                            <Textarea value={typeAmenities} onChange={e => setTypeAmenities(e.target.value)} placeholder="Wifi, TV, Jacuzzi, Balcony..." />
                        </div>

                        {/* IMAGES */}
                        <div className="space-y-2">
                            <Label>Images</Label>
                            <RoomImages value={typeImages} onChange={setTypeImages} maxImages={5} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveType}>{editingType ? "Update Category" : "Create Category"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CREATE ROOM DIALOG */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Room to {roomTypes.find(t => t.id === selectedTypeId)?.name}</DialogTitle>
                        <DialogDescription>Adding a physical unit to this category.</DialogDescription>
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
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveRoom}>Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION */}
            <Dialog open={!!deleteAnalysis} onOpenChange={(open) => !open && setDeleteAnalysis(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This will delete the category "{deleteAnalysis?.name}". You cannot delete a category that has rooms attached.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteAnalysis(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTypeConfirm}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
