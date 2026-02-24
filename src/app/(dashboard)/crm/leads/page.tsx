"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Filter, ArrowRight, UserPlus, Mail, Phone, Building2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";

interface CrmLead {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    status: string;
    priority: string;
    expectedRevenue?: number;
    createdAt: string;
}

export default function CRMLeadsPage() {
    const [leads, setLeads] = useState<CrmLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/crm/leads");
            if (!res.ok) throw new Error("Failed to load leads");

            const payload = await res.json();
            const items = payload.items || payload.data || (Array.isArray(payload) ? payload : []);
            setLeads(items);
        } catch (err) {
            setError("Could not load leads connecting to the API.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "NEW": return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">New</Badge>;
            case "CONTACTED": return <Badge variant="secondary" className="bg-blue-100/50 text-blue-700 border-blue-200">Contacted</Badge>;
            case "QUALIFIED": return <Badge variant="outline" className="bg-emerald-100/50 text-emerald-700 border-emerald-200 font-bold">Qualified</Badge>;
            case "UNQUALIFIED": return <Badge variant="destructive" className="bg-rose-100/50 text-rose-700 border-rose-200">Unqualified</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'URGENT':
            case 'HIGH': return <Badge variant="destructive" className="bg-rose-100 text-rose-700 font-bold border-rose-200">{priority}</Badge>;
            case 'MEDIUM': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold border-amber-200">{priority}</Badge>;
            case 'LOW': return <Badge variant="outline" className="bg-slate-100 text-slate-600 font-bold border-slate-200">{priority}</Badge>;
            default: return <Badge variant="outline">{priority}</Badge>;
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Leads & Prospects
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Qualify incoming prospects before converting them to pipeline opportunities.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex glass h-10 px-4">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button className="flex-1 sm:flex-none shadow-glow-sm hover:shadow-glow transition-shadow h-10 px-6">
                        <UserPlus className="mr-2 h-4 w-4" /> Add Lead
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-shake">
                    <AlertTitle>Network Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
            ) : leads.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center glass rounded-3xl border-dashed border-2">
                    <UserPlus className="h-16 w-16 text-muted-foreground opacity-10 mb-4" />
                    <p className="text-muted-foreground text-xl font-medium">No leads currently in your queue</p>
                    <Button variant="link" className="mt-4 text-primary">Manually import leads</Button>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block glass rounded-2xl border-primary/5 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50 dark:bg-muted/20 backdrop-blur-md">
                                <TableRow className="border-b-primary/5 hover:bg-transparent">
                                    <TableHead className="pl-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Prospect Identity</TableHead>
                                    <TableHead className="py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Contact Strategy</TableHead>
                                    <TableHead className="py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">Lifecycle Stage</TableHead>
                                    <TableHead className="py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground text-center">Priority</TableHead>
                                    <TableHead className="text-right pr-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Commercial Appraisal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead, idx) => (
                                    <TableRow
                                        key={lead.id}
                                        className="group cursor-pointer hover:bg-primary/5 transition-colors border-b-primary/5 hover:border-primary/10 animate-fade-in-up"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <TableCell className="font-medium px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform ring-1 ring-primary/5">
                                                    {lead.company?.charAt(0) || lead.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                                                        {lead.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <Building2 className="h-3 w-3" />
                                                        {lead.company}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Mail className="h-3 w-3 text-muted-foreground" /> {lead.email || "—"}
                                                </div>
                                                {lead.phone && (
                                                    <div className="text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Phone className="h-3 w-3 text-muted-foreground" /> {lead.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(lead.status)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getPriorityBadge(lead.priority)}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="font-mono font-black text-slate-800 dark:text-slate-100">
                                                    {formatCurrency(lead.expectedRevenue || 0)}
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-8 text-[10px] group-hover:bg-primary/10 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all px-2">
                                                    Qualify Deal <ChevronRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile/Tablet Card View */}
                    <div className="lg:hidden space-y-4">
                        {leads.map((lead, idx) => (
                            <Card key={lead.id} className="glass hover-lift border-primary/5 overflow-hidden group animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                <CardContent className="p-5 flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold ring-1 ring-primary/5">
                                                {lead.company?.charAt(0) || lead.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg group-hover:text-primary transition-colors">
                                                    {lead.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    {lead.company}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            {getPriorityBadge(lead.priority)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-primary/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Lifecycle</p>
                                            {getStatusBadge(lead.status)}
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Value Appraisal</p>
                                            <p className="font-mono font-black text-primary">{formatCurrency(lead.expectedRevenue || 0)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10 transition-all">
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                            {lead.phone && (
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10 transition-all">
                                                    <Phone className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <Button className="shadow-sm hover:shadow-glow-sm transition-shadow rounded-xl h-9 px-4">
                                            Engage Lead
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
