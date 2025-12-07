"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, CheckSquare, Clock, Users, RefreshCw, BarChart } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  budget: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { name: string };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/projects/tasks'),
      ]);

      if (projectsRes.ok) setProjects((await projectsRes.json()) ?? []);
      if (tasksRes.ok) setTasks((await tasksRes.json()) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'IN_PROGRESS').length, [projects]);
  const pendingTasks = useMemo(() => tasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length, [tasks]);
  const totalBudget = useMemo(() => projects.reduce((sum, p) => sum + (p.budget || 0), 0), [projects]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Plan projects, assign tasks, and track progress across teams.</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Active Projects" value={String(activeProjects)} subtitle={`${projects.length} total`} icon={Briefcase} variant="indigo" />
        <StatCard title="Pending Tasks" value={String(pendingTasks)} subtitle={`${tasks.length} total tasks`} icon={CheckSquare} variant="sky" />
        <StatCard title="Total Budget" value={`$${(totalBudget / 1000).toFixed(0)}k`} subtitle="Allocated funds" icon={BarChart} variant="emerald" />
        <StatCard title="Team Members" value="0" subtitle="Across projects" icon={Users} variant="purple" />
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Portfolio</CardTitle>
              <CardDescription>Monitor project status and deliverables.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading projects..." />
              ) : projects.length === 0 ? (
                <EmptyState message="No projects found." />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.map((project) => (
                    <div key={project.id} className="space-y-3 rounded-xl border border-gray-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                        </div>
                        <Badge variant={project.status === 'IN_PROGRESS' ? 'default' : project.status === 'COMPLETED' ? 'secondary' : 'outline'}>{project.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-xs text-gray-500">Start</p><p className="font-medium">{formatDate(project.startDate)}</p></div>
                        <div><p className="text-xs text-gray-500">End</p><p className="font-medium">{project.endDate ? formatDate(project.endDate) : 'Ongoing'}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Board</CardTitle>
              <CardDescription>Track individual task assignments and deadlines.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading tasks..." />
              ) : tasks.length === 0 ? (
                <EmptyState message="No tasks assigned." />
              ) : (
                <div className="space-y-3">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-100 p-2"><CheckSquare className="h-4 w-4 text-indigo-600" /></div>
                        <div>
                          <p className="font-semibold text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500">{task.project.name} · {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No deadline'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'secondary' : 'outline'}>{task.priority}</Badge>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, variant }: { title: string; value: string; subtitle: string; icon: typeof Briefcase; variant: 'indigo' | 'sky' | 'emerald' | 'purple' }) {
  const accentMap = { indigo: 'bg-indigo-100 text-indigo-600', sky: 'bg-sky-100 text-sky-600', emerald: 'bg-emerald-100 text-emerald-600', purple: 'bg-purple-100 text-purple-600' } as const;
  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between p-6">
        <div><p className="text-sm font-medium text-gray-500">{title}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{subtitle}</p></div>
        <div className={`rounded-xl p-3 ${accentMap[variant]}`}><Icon className="h-6 w-6" /></div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ message }: { message: string }) {
  return <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-gray-500">{message}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-sm text-gray-500">{message}</div>;
}
