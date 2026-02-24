"use client";

import { useState, useEffect, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, DollarSign, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface CrmOpportunity {
    id: string;
    name: string;
    stage: string;
    amount: number;
    probability: number;
    currency?: string;
    expectedCloseDate?: string;
}

interface KanbanStage {
    id: string;
    name: string;
    sequence: number;
    probabilityPercent: number;
    opportunities: CrmOpportunity[];
}

const DEFAULT_STAGES = [
    { id: "PROSPECTING", name: "Prospecting", sequence: 10, probabilityPercent: 10 },
    { id: "QUALIFICATION", name: "Qualification", sequence: 20, probabilityPercent: 30 },
    { id: "PROPOSAL", name: "Proposal", sequence: 30, probabilityPercent: 60 },
    { id: "NEGOTIATION", name: "Negotiation", sequence: 40, probabilityPercent: 80 },
    { id: "WON", name: "Closed Won", sequence: 50, probabilityPercent: 100 },
    { id: "LOST", name: "Closed Lost", sequence: 60, probabilityPercent: 0 },
];

export default function CRMPipelinesPage() {
    const [stages, setStages] = useState<KanbanStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPipeline();
    }, []);

    const fetchPipeline = async () => {
        try {
            setLoading(true);
            const [oppRes, pipeRes] = await Promise.all([
                fetch("/api/crm/opportunities"),
                fetch("/api/crm/pipelines")
            ]);

            if (!oppRes.ok) throw new Error("Failed to load opportunities");
            if (!pipeRes.ok) throw new Error("Failed to load pipeline configuration");

            const oppPayload = await oppRes.json();
            const data: CrmOpportunity[] = oppPayload.items || oppPayload.data || (Array.isArray(oppPayload) ? oppPayload : []);

            const pipePayload = await pipeRes.json();
            const pipelinesData = pipePayload.items || pipePayload.data || (Array.isArray(pipePayload) ? pipePayload : []);

            // Default to the first configured pipeline
            const activePipeline = pipelinesData[0];
            const apiStages = activePipeline?.stages || [];

            if (apiStages.length === 0) {
                setStages([]);
                return;
            }

            const constructedStages = apiStages.map((stage: any) => ({
                id: stage.id,
                name: stage.name,
                sequence: stage.sequence || 0,
                probabilityPercent: stage.probabilityPercent || 0,
                opportunities: data.filter(opp => opp.stage === stage.id)
            }));

            // Handle any opportunities with unknown stages by putting them in the first column
            const unknownOpps = data.filter(opp => !apiStages.find((s: any) => s.id === opp.stage));
            if (unknownOpps.length > 0 && constructedStages.length > 0) {
                constructedStages[0].opportunities.push(...unknownOpps);
            }

            setStages(constructedStages);
        } catch (err) {
            setError("Failed to load pipeline stages. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e: DragEvent<HTMLDivElement>, oppId: string) => {
        setDraggingId(oppId);
        e.dataTransfer.setData("text/plain", oppId);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStageId: string) => {
        e.preventDefault();
        const oppId = e.dataTransfer.getData("text/plain");
        if (!oppId || !targetStageId) return;

        // Optimistically update UI
        let movedOpp: CrmOpportunity | undefined;
        setStages(prevStages => {
            const nextStages = [...prevStages];

            // Remove from old stage
            for (const stage of nextStages) {
                const idx = stage.opportunities.findIndex(o => o.id === oppId);
                if (idx !== -1) {
                    movedOpp = stage.opportunities[idx];
                    stage.opportunities.splice(idx, 1);
                    break;
                }
            }

            // Add to new stage
            if (movedOpp) {
                movedOpp.stage = targetStageId;
                const targetStage = nextStages.find(s => s.id === targetStageId);
                if (targetStage) {
                    targetStage.opportunities.push(movedOpp);
                }
            }
            return nextStages;
        });

        // Backend update
        if (movedOpp) {
            try {
                const res = await fetch(`/api/crm/opportunities/${oppId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stage: targetStageId })
                });

                if (!res.ok) {
                    throw new Error("Failed to update pipeline stage");
                }
            } catch (err) {
                console.error(err);
                // Revert on failure by re-fetching
                fetchPipeline();
            }
        }
        setDraggingId(null);
    };

    if (loading) {
        return (
            <div className="space-y-4 h-full">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-150px)]">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-full w-[300px] flex-shrink-0 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Pipelines
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Accelerate deals through your custom sales workflow via drag and drop.
                    </p>
                </div>
                <Button className="w-full sm:w-auto shadow-glow-sm hover:shadow-glow transition-shadow">
                    <Plus className="mr-2 h-4 w-4" />
                    New Opportunity
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-6 h-full min-h-[calc(100vh-250px)] w-max lg:w-full">
                    {stages.map((stage) => (
                        <div
                            key={stage.id}
                            className="flex-shrink-0 w-[85vw] sm:w-[320px] lg:w-full lg:max-w-[340px] flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-primary/5 shadow-sm group/column overflow-hidden"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            <div className="p-4 border-b bg-white/40 dark:bg-black/20 backdrop-blur-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    <div className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-200">
                                        {stage.name}
                                    </div>
                                    <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] font-mono opacity-70">
                                        {stage.opportunities.length}
                                    </Badge>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                {stage.opportunities.length === 0 ? (
                                    <div className="h-32 flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-white/10 group-hover/column:border-primary/20 transition-colors">
                                        <Plus className="h-6 w-6 text-muted-foreground/20 mb-2" />
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                            Drop deal here
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {stage.opportunities.map((opp, idx) => (
                                            <div
                                                key={opp.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, opp.id)}
                                                className={`animate-fade-in-up ${draggingId === opp.id ? 'opacity-30 scale-95' : 'opacity-100'} transition-all`}
                                                style={{ animationDelay: `${idx * 40}ms` }}
                                            >
                                                <Card className="hover-lift cursor-grab active:cursor-grabbing border-primary/5 hover:border-primary/20 shadow-soft bg-white/80 dark:bg-slate-950/80 backdrop-blur-md overflow-hidden group/card relative">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                                    <CardContent className="p-4 space-y-3">
                                                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate flex items-center justify-between gap-2" title={opp.name}>
                                                            {opp.name}
                                                            <div className="hidden group-hover/card:block">
                                                                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div className="space-y-1">
                                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                                                                    <DollarSign className="h-3 w-3" /> Potential
                                                                </div>
                                                                <div className="text-sm font-black text-primary font-mono tabular-nums leading-none">
                                                                    {formatCurrency(opp.amount || 0, opp.currency || "USD")}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${opp.probability > 70 ? 'bg-success/10 text-success border border-success/20' :
                                                                    opp.probability > 30 ? 'bg-warning/10 text-warning border border-warning/20' :
                                                                        'bg-slate-100 text-slate-500 border border-slate-200'
                                                                    }`}>
                                                                    {opp.probability}%
                                                                </div>
                                                                <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-500 ${opp.probability > 70 ? 'bg-success' :
                                                                            opp.probability > 30 ? 'bg-warning' : 'bg-slate-400'
                                                                            }`}
                                                                        style={{ width: `${opp.probability}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
