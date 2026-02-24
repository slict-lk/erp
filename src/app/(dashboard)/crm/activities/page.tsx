"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle, Clock, Mail, Phone, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CrmActivity {
    id: string;
    activityType: string;
    subject: string;
    description?: string;
    status: string;
    scheduledAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt?: string;
}

export default function CRMActivitiesPage() {
    const [tasks, setTasks] = useState<CrmActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/crm/activities");
            if (!res.ok) throw new Error("Failed to load activities");

            const payload = await res.json();
            const items = payload.items || payload.data || (Array.isArray(payload) ? payload : []);
            setTasks(items);
        } catch (err) {
            setError("Could not load latest activities.");
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type?.toUpperCase()) {
            case "CALL": return <Phone className="h-4 w-4 text-blue-500" />;
            case "EMAIL": return <Mail className="h-4 w-4 text-amber-500" />;
            case "MEETING": return <CalendarIcon className="h-4 w-4 text-purple-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Sometime";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const isOverdue = (dateStr?: string) => {
        if (!dateStr) return false;
        return new Date(dateStr).getTime() < Date.now();
    };

    const pendingTasks = tasks.filter(t => t.status === "PENDING" || t.status === "SCHEDULED");
    const completedTasks = tasks.filter(t => t.status === "COMPLETED" || t.status === "CANCELED");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activities & Tasks</h1>
                    <p className="text-muted-foreground mt-2">
                        Stay on top of your customer communications, assignments, and follow-ups.
                    </p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Log Activity
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/10 border-b border-border/50">
                        <CardTitle>Upcoming Tasks</CardTitle>
                        <CardDescription>
                            Your operational task queue awaiting action.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : pendingTasks.length === 0 ? (
                            <div className="text-center p-12 border-dashed border-2 rounded-lg bg-muted/20 flex flex-col items-center">
                                <CheckCircle2 className="h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                                <p className="text-muted-foreground text-sm font-medium">Inbox zero!</p>
                                <p className="text-xs text-muted-foreground">You have no pending tasks to address.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingTasks.map(task => {
                                    const overdue = isOverdue(task.scheduledAt);

                                    return (
                                        <div key={task.id} className="flex items-start gap-4 flex-row p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
                                            <button className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                                                <Circle className="h-5 w-5" />
                                            </button>
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium leading-none">{task.subject}</p>
                                                    {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                                                </div>
                                                {task.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 bg-muted/30 p-1.5 rounded w-fit">
                                                    {getIcon(task.activityType)}
                                                    <span className="capitalize">{task.activityType.toLowerCase()}</span>
                                                    <span>•</span>
                                                    <span className={overdue ? "text-red-500 font-medium" : ""}>
                                                        Due: {formatDate(task.scheduledAt || task.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="bg-muted/10 border-b border-border/50">
                        <CardTitle>Recent History</CardTitle>
                        <CardDescription>
                            A timeline history of completed communications and notes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                            </div>
                        ) : completedTasks.length === 0 ? (
                            <div className="text-center p-12 border-dashed border-2 rounded-lg bg-muted/20">
                                <p className="text-muted-foreground text-sm">No recent activity history.</p>
                            </div>
                        ) : (
                            <div className="space-y-0 relative ml-4 border-l-2 border-muted/50 pb-4">
                                {completedTasks.map((task, index) => (
                                    <div key={task.id} className="relative flex gap-4 pt-6 first:pt-2">
                                        <div className="absolute -left-[11px] top-6 first:top-2">
                                            <div className={`h-5 w-5 rounded-full flex items-center justify-center ring-4 ring-background ${task.status === 'CANCELED' ? 'bg-red-100' : 'bg-green-100'}`}>
                                                {task.status === 'CANCELED' ? (
                                                    <Circle className="h-3 w-3 text-red-600" />
                                                ) : (
                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-1 border rounded-lg p-3 bg-muted/10 shadow-sm ml-2">
                                            <div className="flex items-center justify-between">
                                                <p className={`font-medium text-sm leading-none ${task.status === 'CANCELED' ? 'text-muted-foreground line-through' : ''}`}>
                                                    {task.subject}
                                                </p>
                                                <Badge variant="outline" className="text-[10px] h-5">{formatDate(task.completedAt || task.updatedAt)}</Badge>
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                                {getIcon(task.activityType)}
                                                <span className="capitalize">{task.activityType.toLowerCase()}</span>
                                                {task.status === 'CANCELED' && <span className="text-red-500 font-medium ml-auto">Canceled</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
