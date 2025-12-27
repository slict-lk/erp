'use client';

import { useState, useTransition } from 'react';
import { Search, Car, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { searchCompatibleParts } from '@/lib/actions/search';

interface FitmentSearchManagerProps {
    vehicles: any[]; // List of makes/models to populate dropdowns
}

export function FitmentSearchManager({ vehicles }: FitmentSearchManagerProps) {
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Derive unique makes and models
    const uniqueMakes = Array.from(new Set(vehicles.map(v => v.make)));
    const filteredModels = vehicles.filter(v => v.make === make).map(v => v.model);

    const handleSearch = () => {
        if (!make || !model) return;
        setHasSearched(true);
        startTransition(async () => {
            const parts = await searchCompatibleParts({ make, model, year });
            setResults(parts);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fitment Search</h2>
                    <p className="text-muted-foreground">Find parts compatible with specific vehicles.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Vehicle Filter</CardTitle>
                    <CardDescription>Select a vehicle to see all compatible parts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select value={make} onValueChange={setMake}>
                            <SelectTrigger><SelectValue placeholder="Make (e.g. Toyota)" /></SelectTrigger>
                            <SelectContent>
                                {uniqueMakes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={model} onValueChange={setModel} disabled={!make}>
                            <SelectTrigger><SelectValue placeholder="Model (e.g. Corolla)" /></SelectTrigger>
                            <SelectContent>
                                {filteredModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Input
                            type="number"
                            placeholder="Year (Optional)"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />

                        <Button className="w-full" onClick={handleSearch} disabled={isPending || !make || !model}>
                            {isPending ? <Search className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Find Parts
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {!hasSearched && (
                <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed text-slate-400">
                    <Car className="mx-auto h-12 w-12 opacity-20 mb-3" />
                    <p>Select a vehicle above to browse compatible parts.</p>
                </div>
            )}

            {hasSearched && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-medium">Search Results ({results.length})</h3>
                    {results.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border rounded-lg">
                            No parts found for this vehicle.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {results.map((part) => (
                                <Card key={part.id} className="hover:border-blue-400 transition-colors cursor-pointer">
                                    <CardHeader className="pb-3 bg-slate-50/50">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="font-mono">{part.product.sku}</Badge>
                                            <Badge variant="secondary">{part.partType}</Badge>
                                        </div>
                                        <CardTitle className="text-base mt-2 line-clamp-1">{part.product.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Price:</span>
                                            <span className="font-bold">Rs. {part.product.salePrice}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Stock:</span>
                                            <span className={part.product.stockQty > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                                {part.product.stockQty} Units
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2 border-t pt-2">
                                            Make: {part.brandOrigin || 'Unknown'}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
