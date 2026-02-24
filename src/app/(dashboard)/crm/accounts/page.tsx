"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Building2, UserCircle2, Mail, Phone, ExternalLink, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CrmAccount {
    id: string;
    party?: {
        name: string;
        email?: string;
        phone?: string;
    };
    industry?: string;
    accountType?: string;
    website?: string;
    annualRevenue?: number;
    contacts?: any[];
}

export default function CRMAccountsPage() {
    const [accounts, setAccounts] = useState<CrmAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/crm/accounts");
            if (!res.ok) throw new Error("Failed to load accounts");

            const payload = await res.json();
            const items = payload.items || payload.data || (Array.isArray(payload) ? payload : []);
            setAccounts(items);
        } catch (err) {
            setError("Could not load account directory.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Account Directory
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Navigate your global network of corporate partners and parties.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex glass h-10 px-4">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button className="flex-1 sm:flex-none shadow-glow-sm hover:shadow-glow transition-shadow h-10 px-6">
                        <Plus className="mr-2 h-4 w-4" /> New Account
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-shake">
                    <AlertTitle>Directory Access Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 xl:grid-cols-4">
                {/* Intelligence Panel - Desktop Only */}
                <div className="hidden xl:block xl:col-span-1 space-y-6">
                    <Card className="glass border-primary/10 shadow-sm overflow-hidden sticky top-6 animate-scale-in">
                        <CardHeader className="bg-primary/5 pb-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-tighter">
                                <Building2 className="h-4 w-4" />
                                360° Intelligence
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="text-center p-8 border-dashed border-2 border-primary/10 rounded-2xl bg-muted/5">
                                <UserCircle2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                <p className="text-muted-foreground text-sm font-medium">Select an entity from the directory to build a strategic profile.</p>
                                <Button variant="ghost" className="mt-4 text-xs text-primary h-8">Learn more</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass border-primary/10 shadow-sm p-5 space-y-4 animate-scale-in [animation-delay:100ms]">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portfolio Summary</h4>
                            <div className="flex justify-between items-end">
                                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{accounts.length}</span>
                                <span className="text-xs text-success font-bold flex items-center">+3 this week</span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-primary rounded-full shadow-glow-sm" />
                        </div>
                    </Card>
                </div>

                {/* Main Directory */}
                <div className="xl:col-span-3">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="p-20 text-center glass rounded-3xl border-dashed border-2 flex flex-col items-center">
                            <Building2 className="h-20 w-20 text-muted-foreground opacity-5 mb-6" />
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No Entities Found</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">Capture new commercial accounts or sync your database to see integrated parties here.</p>
                            <Button className="mt-8 rounded-xl h-11 px-8 shadow-glow-sm">Initialize First Account</Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Directory Table */}
                            <div className="hidden lg:block glass rounded-2xl border-primary/5 shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50 dark:bg-muted/20 backdrop-blur-md">
                                        <TableRow className="border-b-primary/5 hover:bg-transparent">
                                            <TableHead className="pl-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Entity Name & Presence</TableHead>
                                            <TableHead className="py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Contact Architecture</TableHead>
                                            <TableHead className="py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Classification</TableHead>
                                            <TableHead className="text-right py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Annual Capital</TableHead>
                                            <TableHead className="text-center pr-6 py-4 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Handoffs</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accounts.map((account, idx) => (
                                            <TableRow
                                                key={account.id}
                                                className="group cursor-pointer hover:bg-primary/5 transition-colors border-b-primary/5 hover:border-primary/10 animate-fade-in-up"
                                                style={{ animationDelay: `${idx * 40}ms` }}
                                            >
                                                <TableCell className="font-medium px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform ring-1 ring-primary/5">
                                                            {(account.party?.name || "U")[0]}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                                                                {account.party?.name || "Unknown Party"}
                                                            </span>
                                                            {account.website && (
                                                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 cursor-pointer hover:text-primary transition-colors">
                                                                    <ExternalLink className="h-3 w-3" /> {account.website}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 text-muted-foreground" /> {account.party?.email || "—"}
                                                        </div>
                                                        {account.party?.phone && (
                                                            <div className="flex items-center gap-2">
                                                                <Phone className="h-3 w-3 text-muted-foreground" /> {account.party?.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col items-start gap-1">
                                                        <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter bg-slate-50 dark:bg-white/5 border-primary/10 text-slate-600 dark:text-slate-400">
                                                            {account.industry || "General"}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{account.accountType || "Standard"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-black text-slate-700 dark:text-slate-200">
                                                    {account.annualRevenue ? formatCurrency(account.annualRevenue) : "—"}
                                                </TableCell>
                                                <TableCell className="text-center pr-6">
                                                    <div className="flex justify-center">
                                                        <Badge variant="secondary" className="font-mono text-[10px] h-6 px-2 bg-primary/10 text-primary border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                                                            {account.contacts?.length || 0}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card Directory */}
                            <div className="lg:hidden space-y-4 px-1">
                                {accounts.map((account, idx) => (
                                    <Card key={account.id} className="glass hover-lift border-primary/5 overflow-hidden group animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                                        <CardContent className="p-5 flex flex-col gap-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold ring-1 ring-primary/5">
                                                        {(account.party?.name || "U")[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-lg group-hover:text-primary transition-colors truncate max-w-[150px]">
                                                            {account.party?.name || "Unknown Party"}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground font-medium">
                                                            {account.accountType || "Standard"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10">
                                                    {account.contacts?.length || 0} Team
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-primary/5">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Industry</p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{account.industry || "General"}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Annual Capital</p>
                                                    <p className="font-mono font-black text-primary">{account.annualRevenue ? formatCurrency(account.annualRevenue) : "N/A"}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    {account.website && (
                                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Button className="shadow-sm hover:shadow-glow-sm transition-shadow rounded-xl h-10 px-6">
                                                    Full 360° View
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
