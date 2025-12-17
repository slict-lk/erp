'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Activity,
    Calendar,
    PieChart
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface SegmentData {
    module: string;
    revenue: number;
    cogs: number;
    opex: number;
    grossProfit: number;
    margin: number;
}

interface FinancialData {
    overview: {
        revenue: number;
        cogs: number;
        opex: number;
        profit: number;
        margin: number;
    };
    segments: SegmentData[];
}

export function FinancialOverview() {
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'month' | 'year'>('month');

    useEffect(() => {
        fetchFinancials();
    }, [period]);

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dashboard/financials?period=${period}`);
            const json = await res.json();
            if (!json.error) {
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch financials", error);
        } finally {
            setLoading(false);
        }
    };

    const getMarginColor = (margin: number) => {
        if (margin >= 50) return 'bg-emerald-100 text-emerald-800';
        if (margin >= 25) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    const getSegmentColor = (name: string) => {
        const colors = [
            'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
            'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
            'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
            'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
            'bg-rose-500'
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const getModuleHref = (module: string) => {
        const map: Record<string, string> = {
            'Sales': '/sales',
            'Inventory': '/inventory',
            'HR': '/hr',
            'Accounting': '/accounting',
            'Manufacturing': '/manufacturing',
            'Real Estate': '/real-estate',
            'Hotel': '/hotel',
            'Restaurant': '/restaurant',
            'CRM': '/sales/leads',
            'Purchasing': '/purchasing',
        };
        return map[module] || '#';
    };

    if (loading) {
        return <FinancialSkeleton />;
    }

    if (!data) return null;

    return (
        <Card className="col-span-12 border-slate-200 shadow-sm animate-in fade-in zoom-in duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        Segment-Wise Profit & Loss Summary
                    </CardTitle>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <Button
                        variant={period === 'month' ? 'outline' : 'ghost'}
                        size="sm"
                        className={`h-7 px-3 text-xs ${period === 'month' ? 'shadow-sm bg-white' : ''}`}
                        onClick={() => setPeriod('month')}
                    >
                        Month
                    </Button>
                    <Button
                        variant={period === 'year' ? 'outline' : 'ghost'}
                        size="sm"
                        className={`h-7 px-3 text-xs ${period === 'year' ? 'shadow-sm bg-white' : ''}`}
                        onClick={() => setPeriod('year')}
                    >
                        Year
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="pt-4">
                {/* Top Level Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Link href="/accounting/invoices" className="block">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-emerald-900 group-hover:text-emerald-600 transition-colors">{formatCurrency(data.overview.revenue)}</h3>
                            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-700">
                                <TrendingUp className="h-3 w-3" />
                                +12.5%
                            </div>
                        </div>
                    </Link>

                    <Link href="/accounting/expenses" className="block">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">Expenses (Opex)</p>
                            <h3 className="text-2xl font-bold text-red-900 group-hover:text-red-600 transition-colors">{formatCurrency(data.overview.opex)}</h3>
                            <div className="flex items-center gap-1 mt-2 text-xs text-red-700">
                                <TrendingDown className="h-3 w-3" />
                                -2.1%
                            </div>
                        </div>
                    </Link>

                    <Link href="/reports" className="block">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Gross Profit</p>
                            <h3 className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors">{formatCurrency(data.overview.profit)}</h3>
                            <Progress value={75} className="h-1.5 mt-2 bg-blue-100" />
                        </div>
                    </Link>

                    <Link href="/reports" className="block">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-1">Profit Margin</p>
                            <h3 className="text-2xl font-bold text-amber-900 group-hover:text-amber-600 transition-colors">{data.overview.margin.toFixed(1)}%</h3>
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-700">
                                <Activity className="h-3 w-3" />
                                Healthy
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Detailed Table */}
                <div className="rounded-lg border border-slate-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[180px]">Module</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                                <TableHead className="text-right">COGS & Opex</TableHead>
                                <TableHead className="text-right">Gross Profit</TableHead>
                                <TableHead className="text-right">Profit Margin %</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.segments.map((segment) => (
                                <TableRow key={segment.module} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <Link href={getModuleHref(segment.module)} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                            <div className={`w-2 h-2 rounded-full ${getSegmentColor(segment.module)}`} />
                                            {segment.module}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-700">
                                        {formatCurrency(segment.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right text-slate-500">
                                        {formatCurrency(segment.cogs + segment.opex)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-800">
                                        {formatCurrency(segment.grossProfit)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="secondary" className={`${getMarginColor(segment.margin)} border-0`}>
                                            {segment.margin.toFixed(1)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Progress value={segment.margin} className="h-2 w-full bg-slate-100" />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Total Row */}
                            <TableRow className="bg-slate-50/80 font-bold border-t-2 border-slate-100">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right text-emerald-700">{formatCurrency(data.overview.revenue)}</TableCell>
                                <TableCell className="text-right text-red-700">{formatCurrency(data.overview.cogs + data.overview.opex)}</TableCell>
                                <TableCell className="text-right text-blue-700">{formatCurrency(data.overview.profit)}</TableCell>
                                <TableCell className="text-right"></TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function FinancialSkeleton() {
    return (
        <Card className="col-span-12 h-[400px]">
            <CardHeader>
                <div className="h-8 w-[200px] bg-slate-200 animate-pulse rounded" />
                <div className="h-4 w-[300px] bg-slate-200 animate-pulse rounded mt-2" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
                    <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
                </div>
                <div className="space-y-4">
                    <div className="h-12 w-full bg-slate-200 animate-pulse rounded" />
                    <div className="h-12 w-full bg-slate-200 animate-pulse rounded" />
                    <div className="h-12 w-full bg-slate-200 animate-pulse rounded" />
                </div>
            </CardContent>
        </Card>
    )
}
