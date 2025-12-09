'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Armchair, Move, Trash2, Snowflake, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type Table = {
    id: string;
    name: string;
    x: number;
    y: number;
    capacity: number;
    shape: 'rect' | 'circle';
    zone: 'AC' | 'OUTDOOR';
}

export default function FloorPlanPage() {
    const [tables, setTables] = useState<Table[]>([
        { id: '1', name: 'T1', x: 20, y: 20, capacity: 4, shape: 'rect', zone: 'AC' },
        { id: '2', name: 'T2', x: 200, y: 150, capacity: 2, shape: 'circle', zone: 'AC' },
        { id: '3', name: 'O1', x: 400, y: 50, capacity: 6, shape: 'rect', zone: 'OUTDOOR' },
    ]);

    const [activeZone, setActiveZone] = useState('AC');
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    const addTable = () => {
        const newTable: Table = {
            id: Math.random().toString(36).substr(2, 9),
            name: `T${tables.length + 1}`,
            x: 50,
            y: 50,
            capacity: 4,
            shape: 'rect',
            zone: activeZone as 'AC' | 'OUTDOOR'
        };
        setTables([...tables, newTable]);
        setSelectedTable(newTable.id);
    };

    const updateTable = (id: string, updates: Partial<Table>) => {
        setTables(tables.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTable = (id: string) => {
        setTables(tables.filter(t => t.id !== id));
        setSelectedTable(null);
    };

    const saveLayout = () => {
        toast.success('Floor plan saved successfully!');
        // Save to API here
    };

    // Simple drag simulation logic using classic mouse events would go here
    // For this v1, we assume users click and edit coordinates or visually see the layout
    // A full DND implementation requires more complex event handling

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
            <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        Floor Plan Designer
                        <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Beta</span>
                    </h1>
                    <p className="text-xs text-slate-500">Design your restaurant layout by zones.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={addTable} className="border-dashed border-slate-400">
                        <Plus className="mr-2 h-4 w-4" /> Add Table
                    </Button>
                    <Button onClick={saveLayout} className="bg-slate-900 text-white">
                        <Save className="mr-2 h-4 w-4" /> Save Layout
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Canvas Area */}
                <div className="flex-1 bg-slate-100 p-8 relative overflow-auto grid-pattern">
                    <div className="max-w-[1000px] h-[600px] mx-auto bg-white shadow-xl rounded-xl border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-4 left-4 flex gap-2 z-10">
                            <Button
                                size="sm"
                                variant={activeZone === 'AC' ? 'default' : 'outline'}
                                onClick={() => setActiveZone('AC')}
                                className={activeZone === 'AC' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white'}
                            >
                                <Snowflake className="mr-2 h-3 w-3" /> A/C Zone
                            </Button>
                            <Button
                                size="sm"
                                variant={activeZone === 'OUTDOOR' ? 'default' : 'outline'}
                                onClick={() => setActiveZone('OUTDOOR')}
                                className={activeZone === 'OUTDOOR' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-white'}
                            >
                                <Sun className="mr-2 h-3 w-3" /> Outdoor
                            </Button>
                        </div>

                        {tables.filter(t => t.zone === activeZone).map(table => (
                            <motion.div
                                key={table.id}
                                drag
                                dragMomentum={false}
                                dragConstraints={{ left: 0, top: 0, right: 900, bottom: 500 }}
                                onDragEnd={(_, info) => {
                                    // In a real app, calculate true new x/y relative to container
                                    // This visual drag needs to be persisted ideally
                                }}
                                onClick={() => setSelectedTable(table.id)}
                                className={`absolute cursor-move flex items-center justify-center border-2 transition-colors
                            ${table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
                            ${selectedTable === table.id ? 'border-blue-600 bg-blue-50 z-20 shadow-lg' : 'border-slate-300 bg-white hover:border-blue-300'}
                        `}
                                style={{
                                    left: table.x,
                                    top: table.y,
                                    width: table.capacity > 4 ? 120 : 80,
                                    height: table.capacity > 4 ? 80 : 80
                                }}
                            >
                                <div className="text-center">
                                    <div className="font-bold text-slate-800">{table.name}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                                        <UsersIcon className="h-3 w-3" /> {table.capacity}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Properties Panel */}
                {selectedTable && (
                    <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col h-full shadow-lg z-20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Edit Table</h3>
                            <Button variant="ghost" size="icon" onClick={() => deleteTable(selectedTable)} className="text-red-500 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {tables.find(t => t.id === selectedTable) && (() => {
                            const t = tables.find(item => item.id === selectedTable)!;
                            return (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Table Name</Label>
                                        <Input
                                            value={t.name}
                                            onChange={(e) => updateTable(t.id, { name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Capacity (Pax)</Label>
                                        <Input
                                            type="number"
                                            value={t.capacity}
                                            onChange={(e) => updateTable(t.id, { capacity: parseInt(e.target.value) || 2 })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Shape</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={t.shape === 'rect' ? 'default' : 'outline'}
                                                onClick={() => updateTable(t.id, { shape: 'rect' })}
                                                className="w-full"
                                            >
                                                Rectangle
                                            </Button>
                                            <Button
                                                variant={t.shape === 'circle' ? 'default' : 'outline'}
                                                onClick={() => updateTable(t.id, { shape: 'circle' })}
                                                className="w-full"
                                            >
                                                Circle
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="mt-auto pt-6 text-xs text-slate-400">
                            <p>Tip: Drag items to position them.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function UsersIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    )
}
