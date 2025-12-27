'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeftRight, PackagePlus, PackageMinus, Search, Check, Loader2, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createStockAdjustment, searchProducts } from '@/lib/actions/stock';

interface StockAdjustmentManagerProps {
    initialMovements: any[];
    warehouses: any[];
}

export function StockAdjustmentManager({ initialMovements, warehouses }: StockAdjustmentManagerProps) {
    const [movements, setMovements] = useState(initialMovements);
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
    const [productSearchOpen, setProductSearchOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const { toast } = useToast();

    const handleProductSearch = async (query: string) => {
        if (query.length > 1) {
            const results = await searchProducts(query);
            setProducts(results);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const qty = parseFloat(formData.get('quantity') as string);
        const warehouseId = formData.get('warehouseId') as string;
        const notes = formData.get('notes') as string;

        if (!selectedProduct || !qty || !warehouseId) return;

        startTransition(async () => {
            const result = await createStockAdjustment({
                productId: selectedProduct.id,
                warehouseId,
                type: adjustmentType,
                quantity: qty,
                notes
            });

            if (result.success) {
                toast({ title: 'Success', description: 'Stock adjusted successfully' });
                setIsOpen(false);
                // In a real app we'd refresh the list or revalidate path works to refresh server props if we redirect/refresh
                window.location.reload();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Stock Adjustments</h2>
                    <p className="text-muted-foreground">Record stock intake, usage, and variance.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setAdjustmentType('OUT'); setIsOpen(true); }}>
                        <PackageMinus className="mr-2 h-4 w-4 text-red-500" /> Reduce Stock
                    </Button>
                    <Button onClick={() => { setAdjustmentType('IN'); setIsOpen(true); }}>
                        <PackagePlus className="mr-2 h-4 w-4" /> Add Stock
                    </Button>
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{adjustmentType === 'IN' ? 'Add Stock' : 'Reduce Stock'}</DialogTitle>
                        <DialogDescription>Record a manual stock movement.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Product</label>
                            <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={productSearchOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedProduct
                                            ? `${selectedProduct.sku} - ${selectedProduct.name}`
                                            : "Search product by SKU or Name..."}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput placeholder="Search..." onValueChange={handleProductSearch} />
                                        <CommandEmpty>No product found.</CommandEmpty>
                                        <CommandGroup>
                                            {products.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.id}
                                                    onSelect={() => {
                                                        setSelectedProduct(product);
                                                        setProductSearchOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {product.sku} - {product.name} (Stock: {product.stockQty})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Quantity</label>
                                <Input type="number" name="quantity" required min="1" step="0.01" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Warehouse</label>
                                <Select name="warehouseId" defaultValue={warehouses[0]?.id}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes / Reason</label>
                            <Input name="notes" placeholder="e.g. Received shipment, Damaged goods" />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Adjustment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5 text-slate-500" />
                        Recent Movements
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Warehouse</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No stock movements recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movements.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(m.movementDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={m.type === 'IN' ? 'default' : m.type === 'OUT' ? 'destructive' : 'secondary'}>
                                                {m.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{m.product.sku}</div>
                                            <div className="text-xs text-muted-foreground">{m.product.name}</div>
                                        </TableCell>
                                        <TableCell className="font-bold">{m.quantity}</TableCell>
                                        <TableCell>{m.warehouse?.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{m.notes || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
