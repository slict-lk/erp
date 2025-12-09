'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type OrderItem = {
    name: string;
    quantity: number;
    notes?: string;
};

type Ticket = {
    id: string;
    table: string;
    type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    status: 'PENDING' | 'PREPARING' | 'READY';
    items: OrderItem[];
    startTime: Date;
};

const MOCK_TICKETS: Ticket[] = [
    {
        id: 'KOT-101',
        table: 'Table 4',
        type: 'DINE_IN',
        status: 'PREPARING',
        startTime: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
        items: [
            { name: 'Chicken Kottu (L)', quantity: 2, notes: 'Spicy Level 3' },
            { name: 'EGB Glass Bottle', quantity: 2 }
        ]
    },
    {
        id: 'KOT-102',
        table: 'Walk-in-Kumar',
        type: 'TAKEAWAY',
        status: 'PENDING',
        startTime: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
        items: [
            { name: 'Mixed Fried Rice', quantity: 1 },
            { name: 'Chilli Paste', quantity: 1 }
        ]
    },
    {
        id: 'KOT-103',
        table: 'Table 6',
        type: 'DINE_IN',
        status: 'PENDING',
        startTime: new Date(Date.now() - 1000 * 60 * 2), // 2 mins ago
        items: [
            { name: 'Hot Butter Cuttlefish', quantity: 1 },
            { name: 'Cheese Kottu', quantity: 1, notes: 'No Onion' }
        ]
    }
];

export default function KDSPage() {
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update timers every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60);
        return () => clearInterval(timer);
    }, []);

    const getElapsedTime = (start: Date) => {
        const diff = Math.floor((currentTime.getTime() - start.getTime()) / 60000);
        return `${diff}m`;
    };

    const getUrgencyColor = (start: Date) => {
        const diff = (currentTime.getTime() - start.getTime()) / 60000;
        if (diff > 20) return 'bg-red-100 border-red-200 text-red-700';
        if (diff > 10) return 'bg-yellow-100 border-yellow-200 text-yellow-700';
        return 'bg-green-100 border-green-200 text-green-700'; // Fresh
    };

    const handleBump = (id: string) => {
        setTickets(prev => prev.filter(t => t.id !== id));
        toast.success(`Ticket #${id} Completed!`);
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-slate-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <span className="text-orange-500">KDS</span> Kitchen Display System
                    </h1>
                    <p className="text-slate-400">Live Orders • {tickets.length} Active</p>
                </div>
                <div className="flex gap-2">
                    <Tabs defaultValue="all" className="w-[400px]">
                        <TabsList className="bg-slate-800 text-slate-400">
                            <TabsTrigger value="all">All Stations</TabsTrigger>
                            <TabsTrigger value="wok">Wok Station</TabsTrigger>
                            <TabsTrigger value="grill">Grill</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tickets.map(ticket => (
                    <Card key={ticket.id} className="bg-slate-800 border-slate-700 shadow-xl overflow-hidden flex flex-col">
                        <div className={`p-3 border-b border-white/10 flex justify-between items-start ${getUrgencyColor(ticket.startTime)} bg-opacity-10`}>
                            <div>
                                <div className="font-bold text-lg">#{ticket.id}</div>
                                <div className="font-medium opacity-90">{ticket.table}</div>
                                <Badge variant="secondary" className="mt-1 bg-black/20 text-current hover:bg-black/30 border-0">
                                    {ticket.type}
                                </Badge>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-1 font-mono font-bold text-xl">
                                    <Clock className="h-4 w-4" />
                                    {getElapsedTime(ticket.startTime)}
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-4 flex-1">
                            <ul className="space-y-3">
                                {ticket.items.map((item, idx) => (
                                    <li key={idx} className="flex gap-2 items-start py-1 border-b border-slate-700/50 last:border-0">
                                        <span className="font-bold text-orange-400 w-6 text-center bg-slate-700/50 rounded">{item.quantity}</span>
                                        <div className="flex-1">
                                            <span className="font-medium text-slate-200 text-lg leading-tight">{item.name}</span>
                                            {item.notes && (
                                                <p className="text-red-400 text-sm font-medium mt-0.5 italic">** {item.notes} **</p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
                                onClick={() => handleBump(ticket.id)}
                            >
                                <CheckCircle2 className="mr-2 h-6 w-6" />
                                BUMP TICKET
                            </Button>
                        </div>
                    </Card>
                ))}

                {tickets.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center text-slate-600">
                        <CheckCircle2 className="h-24 w-24 mb-4 opacity-20" />
                        <h2 className="text-2xl font-bold opacity-50">All Caught Up!</h2>
                        <p>Waiting for new orders...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
