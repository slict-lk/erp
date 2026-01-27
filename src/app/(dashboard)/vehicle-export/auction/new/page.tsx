"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Gavel, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

const AUCTION_HOUSES = [
    'USS Tokyo', 'USS Nagoya', 'USS Kobe', 'USS Osaka', 'USS Fukuoka',
    'TAA', 'HAA', 'JU', 'CAA', 'Other'
];

const AUCTION_GRADES = ['S', '6', '5', '4.5', '4', '3.5', '3', '2', '1', 'R', 'RA', 'RB', '***'];

const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'DCT'];

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'];

const MAKES = [
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 'Mitsubishi', 'Subaru',
    'Daihatsu', 'Isuzu', 'Lexus', 'Infiniti', 'Acura', 'Other'
];

export default function AuctionEntryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bidId = searchParams.get('bidId');
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [bid, setBid] = useState<any>(null);

    const [form, setForm] = useState({
        chassisNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        month: 1,
        engineCode: '',
        engineCc: '',
        fuelType: 'Petrol',
        color: '',
        transmission: 'Automatic',
        mileage: '',
        purchasePrice: '',
        auctionHouse: '',
        auctionDate: new Date().toISOString().split('T')[0],
        lotNumber: '',
        auctionGrade: '',
        auctionFee: '',
        inspectionNotes: '',
    });

    // Load bid if provided
    useEffect(() => {
        if (bidId) {
            fetch(`/api/vehicle-export/bids/${bidId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.bid) {
                        setBid(data.bid);
                        setForm(prev => ({
                            ...prev,
                            make: data.bid.requestedMake || '',
                            model: data.bid.requestedModel || '',
                        }));
                    }
                });
        }
    }, [bidId]);

    const handleChange = (field: string, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.chassisNumber || !form.make || !form.model || !form.purchasePrice) {
            toast({ title: 'Missing Fields', description: 'Please fill in required fields', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/vehicle-export/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    year: Number(form.year),
                    month: Number(form.month),
                    mileage: Number(form.mileage) || 0,
                    purchasePrice: Number(form.purchasePrice),
                    auctionFee: Number(form.auctionFee) || 0,
                    engineCc: Number(form.engineCc) || null,
                    customerId: bid?.customerId,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                toast({ title: 'Vehicle Created', description: `Stock #${data.vehicle.stockNumber} created successfully` });

                // If linked to bid, update bid status to WON
                if (bidId) {
                    await fetch(`/api/vehicle-export/bids/${bidId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'WON' }),
                    });
                }

                router.push(`/vehicle-export/inventory/${data.vehicle.id}`);
            } else {
                const error = await res.json();
                toast({ title: 'Error', description: error.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create vehicle', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/vehicle-export">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Gavel className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Auction Entry
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Enter vehicle details from auction win
                    </p>
                </div>
            </div>

            {/* Bid Info */}
            {bid && (
                <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Creating for Bid:</strong> {bid.customer?.name} requested {bid.requestedMake} {bid.requestedModel}
                        </p>
                    </CardContent>
                </Card>
            )}

            <form onSubmit={handleSubmit}>
                {/* Vehicle Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Vehicle Information</CardTitle>
                        <CardDescription>Basic vehicle details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Label>Chassis Number *</Label>
                                <Input
                                    value={form.chassisNumber}
                                    onChange={(e) => handleChange('chassisNumber', e.target.value.toUpperCase())}
                                    placeholder="e.g., NCP131-1234567"
                                    className="uppercase"
                                />
                            </div>
                            <div>
                                <Label>Make *</Label>
                                <Select value={form.make} onValueChange={(v) => handleChange('make', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select make" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MAKES.map(make => (
                                            <SelectItem key={make} value={make}>{make}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Model *</Label>
                                <Input
                                    value={form.model}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    placeholder="e.g., Vitz, Aqua, Prius"
                                />
                            </div>
                            <div>
                                <Label>Year</Label>
                                <Select value={form.year.toString()} onValueChange={(v) => handleChange('year', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Month</Label>
                                <Select value={form.month.toString()} onValueChange={(v) => handleChange('month', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => (
                                            <SelectItem key={month} value={month.toString()}>{month}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Transmission</Label>
                                <Select value={form.transmission} onValueChange={(v) => handleChange('transmission', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRANSMISSIONS.map(t => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Fuel Type</Label>
                                <Select value={form.fuelType} onValueChange={(v) => handleChange('fuelType', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FUEL_TYPES.map(f => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Color</Label>
                                <Input
                                    value={form.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    placeholder="e.g., Pearl White"
                                />
                            </div>
                            <div>
                                <Label>Mileage (km)</Label>
                                <Input
                                    type="number"
                                    value={form.mileage}
                                    onChange={(e) => handleChange('mileage', e.target.value)}
                                    placeholder="e.g., 45000"
                                />
                            </div>
                            <div>
                                <Label>Engine Code</Label>
                                <Input
                                    value={form.engineCode}
                                    onChange={(e) => handleChange('engineCode', e.target.value.toUpperCase())}
                                    placeholder="e.g., 1NZ-FE"
                                />
                            </div>
                            <div>
                                <Label>Engine CC</Label>
                                <Input
                                    type="number"
                                    value={form.engineCc}
                                    onChange={(e) => handleChange('engineCc', e.target.value)}
                                    placeholder="e.g., 1500"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Auction Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Auction Details</CardTitle>
                        <CardDescription>Where and how the vehicle was purchased</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Auction House</Label>
                                <Select value={form.auctionHouse} onValueChange={(v) => handleChange('auctionHouse', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select auction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AUCTION_HOUSES.map(house => (
                                            <SelectItem key={house} value={house}>{house}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Auction Date</Label>
                                <Input
                                    type="date"
                                    value={form.auctionDate}
                                    onChange={(e) => handleChange('auctionDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Lot Number</Label>
                                <Input
                                    value={form.lotNumber}
                                    onChange={(e) => handleChange('lotNumber', e.target.value)}
                                    placeholder="e.g., 30512"
                                />
                            </div>
                            <div>
                                <Label>Auction Grade</Label>
                                <Select value={form.auctionGrade} onValueChange={(v) => handleChange('auctionGrade', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AUCTION_GRADES.map(grade => (
                                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Purchase Price (¥) *</Label>
                                <Input
                                    type="number"
                                    value={form.purchasePrice}
                                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                                    placeholder="e.g., 350000"
                                />
                            </div>
                            <div>
                                <Label>Auction Fee (¥)</Label>
                                <Input
                                    type="number"
                                    value={form.auctionFee}
                                    onChange={(e) => handleChange('auctionFee', e.target.value)}
                                    placeholder="e.g., 15000"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Initial Inspection */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Initial Inspection Notes</CardTitle>
                        <CardDescription>Notes for yard team inspection</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={form.inspectionNotes}
                            onChange={(e) => handleChange('inspectionNotes', e.target.value)}
                            placeholder="e.g., Check front bumper, minor scratch on left door..."
                            rows={4}
                        />
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href="/vehicle-export">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Vehicle
                    </Button>
                </div>
            </form>
        </div>
    );
}
