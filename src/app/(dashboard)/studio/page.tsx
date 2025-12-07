"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from 'react-flow-renderer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Layout,
  Database,
  Palette,
  Code,
  Workflow,
  PlusCircle,
  RefreshCw,
  Activity,
} from 'lucide-react';

type ModuleFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'json';

interface ModuleFieldDraft {
  id: string;
  name: string;
  label: string;
  type: ModuleFieldType;
  required: boolean;
  options: string;
}

interface ModuleDraft {
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  fields: ModuleFieldDraft[];
}

type WidgetType = 'chart' | 'metric' | 'table' | 'list' | 'calendar';

interface DashboardWidgetDraft {
  id: string;
  title: string;
  type: WidgetType;
  dataSource: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  metrics?: string;
}

interface DashboardDraft {
  name: string;
  description: string;
  isDefault: boolean;
  widgets: DashboardWidgetDraft[];
}

interface StudioModule {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  schema?: {
    fields?: Array<{ name: string; label: string; type: ModuleFieldType; required?: boolean }>;
    relations?: unknown[];
  };
  views?: Array<{ type: string; name: string }>;
  isActive?: boolean;
  createdAt?: string;
}

interface StudioDashboard {
  id: string;
  name: string;
  description?: string;
  layout?: {
    cols: number;
    rows: number;
    items: Array<{ widgetId: string; x: number; y: number; width: number; height: number }>;
  };
  widgets?: Array<{ id: string; title: string; type: WidgetType }>;
  isDefault?: boolean;
  createdAt?: string;
}

function safeId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export default function StudioPage() {
  const [modules, setModules] = useState<StudioModule[]>([]);
  const [dashboards, setDashboards] = useState<StudioDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingModule, setSavingModule] = useState(false);
  const [savingDashboard, setSavingDashboard] = useState(false);

  const [moduleDraft, setModuleDraft] = useState<ModuleDraft>(() => ({
    name: '',
    description: '',
    icon: 'database',
    isActive: true,
    fields: [
      {
        id: safeId('field'),
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        options: '',
      },
    ],
  }));

  const [dashboardDraft, setDashboardDraft] = useState<DashboardDraft>(() => ({
    name: '',
    description: '',
    isDefault: dashboards.length === 0,
    widgets: [],
  }));

  const initialNodes = useMemo<Node[]>(
    () => [
      {
        id: 'trigger',
        data: { label: 'Workflow Trigger' },
        position: { x: 50, y: 60 },
        type: 'input',
      },
      {
        id: 'action_1',
        data: { label: 'Send Email' },
        position: { x: 300, y: 40 },
      },
      {
        id: 'action_2',
        data: { label: 'Create Task' },
        position: { x: 300, y: 160 },
      },
    ],
    []
  );

  const initialEdges = useMemo<Edge[]>(
    () => [
      { id: 'trigger->action_1', source: 'trigger', target: 'action_1', animated: true },
      { id: 'trigger->action_2', source: 'trigger', target: 'action_2' },
    ],
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [newNodeLabel, setNewNodeLabel] = useState('New Action');
  const [workflowSaved, setWorkflowSaved] = useState(false);

  const fetchStudioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [modulesRes, dashboardsRes] = await Promise.all([
        fetch('/api/studio/modules', { cache: 'no-store' }),
        fetch('/api/studio/dashboards', { cache: 'no-store' }),
      ]);

      if (!modulesRes.ok) {
        throw new Error('Failed to load modules');
      }
      if (!dashboardsRes.ok) {
        throw new Error('Failed to load dashboards');
      }

      const modulesData: StudioModule[] = await modulesRes.json();
      const dashboardsData: StudioDashboard[] = await dashboardsRes.json();

      setModules(Array.isArray(modulesData) ? modulesData : []);
      setDashboards(Array.isArray(dashboardsData) ? dashboardsData : []);

      setDashboardDraft((prev) => ({
        ...prev,
        isDefault: dashboardsData.length === 0,
      }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load studio data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudioData();
  }, [fetchStudioData]);

  const totalCustomFields = useMemo(() => {
    return modules.reduce((count, module) => {
      return count + (module.schema?.fields?.length ?? 0);
    }, 0);
  }, [modules]);

  const handleModuleFieldChange = useCallback(
    (fieldId: string, key: keyof ModuleFieldDraft, value: string | boolean) => {
      setModuleDraft((draft) => ({
        ...draft,
        fields: draft.fields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                [key]: value,
              }
            : field
        ),
      }));
    },
    []
  );

  const addModuleField = useCallback(() => {
    setModuleDraft((draft) => ({
      ...draft,
      fields: [
        ...draft.fields,
        {
          id: safeId('field'),
          name: `field_${draft.fields.length + 1}`,
          label: 'New Field',
          type: 'text',
          required: false,
          options: '',
        },
      ],
    }));
  }, []);

  const removeModuleField = useCallback((fieldId: string) => {
    setModuleDraft((draft) => ({
      ...draft,
      fields: draft.fields.filter((field) => field.id !== fieldId),
    }));
  }, []);

  const resetModuleForm = useCallback(() => {
    setModuleDraft({
      name: '',
      description: '',
      icon: 'database',
      isActive: true,
      fields: [
        {
          id: safeId('field'),
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          options: '',
        },
      ],
    });
  }, []);

  const handleCreateModule = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!moduleDraft.name.trim()) {
        setError('Module name is required');
        return;
      }

      try {
        setSavingModule(true);
        setError(null);

        const payload = {
          name: moduleDraft.name.trim(),
          description: moduleDraft.description.trim() || undefined,
          icon: moduleDraft.icon || undefined,
          isActive: moduleDraft.isActive,
          schema: {
            fields: moduleDraft.fields.map((field) => ({
              name: field.name.trim() || field.id,
              label: field.label.trim() || field.name.trim() || 'Field',
              type: field.type,
              required: field.required,
              options:
                field.type === 'select' || field.type === 'multiselect'
                  ? field.options
                      .split(',')
                      .map((option) => option.trim())
                      .filter(Boolean)
                  : undefined,
            })),
            relations: [],
          },
          views: [
            {
              type: 'list',
              name: 'All Records',
            },
          ],
        };

        const response = await fetch('/api/studio/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to create module');
        }

        const newModule: StudioModule = await response.json();
        setModules((prev) => [newModule, ...prev]);
        resetModuleForm();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to create module');
      } finally {
        setSavingModule(false);
      }
    },
    [moduleDraft, resetModuleForm]
  );

  const addDashboardWidget = useCallback(() => {
    setDashboardDraft((draft) => ({
      ...draft,
      widgets: [
        ...draft.widgets,
        {
          id: safeId('widget'),
          title: `Widget ${draft.widgets.length + 1}`,
          type: 'metric',
          dataSource: '',
          metrics: '',
        },
      ],
    }));
  }, []);

  const updateDashboardWidget = useCallback(
    (
      widgetId: string,
      key: keyof DashboardWidgetDraft,
      value: string | WidgetType | undefined
    ) => {
      setDashboardDraft((draft) => ({
        ...draft,
        widgets: draft.widgets.map((widget) =>
          widget.id === widgetId
            ? {
                ...widget,
                [key]: value,
              }
            : widget
        ),
      }));
    },
    []
  );

  const removeDashboardWidget = useCallback((widgetId: string) => {
    setDashboardDraft((draft) => ({
      ...draft,
      widgets: draft.widgets.filter((widget) => widget.id !== widgetId),
    }));
  }, []);

  const resetDashboardForm = useCallback(() => {
    setDashboardDraft({
      name: '',
      description: '',
      isDefault: dashboards.length === 0,
      widgets: [],
    });
  }, [dashboards.length]);

  const handleCreateDashboard = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!dashboardDraft.name.trim()) {
        setError('Dashboard name is required');
        return;
      }

      if (dashboardDraft.widgets.length === 0) {
        setError('Add at least one widget to create a dashboard');
        return;
      }

      try {
        setSavingDashboard(true);
        setError(null);

        const widgets = dashboardDraft.widgets.map((widget) => ({
          ...widget,
          metrics: widget.metrics
            ?.split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }));

        const layout = {
          cols: 12,
          rows: Math.max(1, widgets.length * 2),
          items: widgets.map((widget, index) => ({
            widgetId: widget.id,
            x: 0,
            y: index * 2,
            width: 12,
            height: 2,
          })),
        };

        const payload = {
          name: dashboardDraft.name.trim(),
          description: dashboardDraft.description.trim() || undefined,
          layout,
          widgets,
          isDefault: dashboardDraft.isDefault,
        };

        const response = await fetch('/api/studio/dashboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to create dashboard');
        }

        const newDashboard: StudioDashboard = await response.json();
        setDashboards((prev) => [newDashboard, ...prev]);
        resetDashboardForm();
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to create dashboard');
      } finally {
        setSavingDashboard(false);
      }
    },
    [dashboardDraft, resetDashboardForm]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    [setEdges]
  );

  const handleAddWorkflowNode = useCallback(() => {
    const id = safeId('node');
    setNodes((nds) => [
      ...nds,
      {
        id,
        data: { label: newNodeLabel.trim() || 'Automation Step' },
        position: {
          x: 120 + nds.length * 30,
          y: 100 + nds.length * 40,
        },
      },
    ]);
    setNewNodeLabel('');
    setWorkflowSaved(false);
  }, [newNodeLabel, setNodes]);

  const handleSaveWorkflow = useCallback(() => {
    setWorkflowSaved(true);
    setTimeout(() => setWorkflowSaved(false), 2500);
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">No-Code Studio</h1>
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            <Activity className="h-4 w-4" />
            Build and automate without code
          </span>
        </div>
        <p className="text-gray-600">
          Design custom data models, dashboards, and automation workflows tailored for every tenant.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Custom Modules" value={modules.length.toString()} icon={Database} accent="bg-teal-100" />
        <StatCard title="Dashboards" value={dashboards.length.toString()} icon={Layout} accent="bg-indigo-100" />
        <StatCard title="Custom Fields" value={totalCustomFields.toString()} icon={Code} accent="bg-amber-100" />
        <StatCard title="Workflow Templates" value="3" icon={Workflow} accent="bg-purple-100" />
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Create custom module</CardTitle>
                <CardDescription>
                  Define new data structures with flexible fields and auto-generated views.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchStudioData} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
              </Button>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleCreateModule}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="module-name">
                      Module name
                    </label>
                    <Input
                      id="module-name"
                      placeholder="e.g. Asset Management"
                      value={moduleDraft.name}
                      onChange={(event) =>
                        setModuleDraft((draft) => ({ ...draft, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="module-icon">
                      Icon (Lucide name)
                    </label>
                    <Input
                      id="module-icon"
                      placeholder="database"
                      value={moduleDraft.icon}
                      onChange={(event) =>
                        setModuleDraft((draft) => ({ ...draft, icon: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="module-description">
                      Description
                    </label>
                    <Textarea
                      id="module-description"
                      placeholder="Describe the purpose of this module"
                      rows={3}
                      value={moduleDraft.description}
                      onChange={(event) =>
                        setModuleDraft((draft) => ({ ...draft, description: event.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="module-active"
                      checked={moduleDraft.isActive}
                      onCheckedChange={(checked) =>
                        setModuleDraft((draft) => ({ ...draft, isActive: checked }))
                      }
                    />
                    <label htmlFor="module-active" className="text-sm text-gray-600">
                      Module active for tenant
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Fields</h3>
                      <p className="text-sm text-gray-500">
                        Capture the data points this module should store.
                      </p>
                    </div>
                    <Button type="button" variant="secondary" onClick={addModuleField}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add field
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {moduleDraft.fields.map((field) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase text-gray-500">
                              Field name
                            </label>
                            <Input
                              placeholder="Internal name"
                              value={field.name}
                              onChange={(event) =>
                                handleModuleFieldChange(field.id, 'name', event.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase text-gray-500">
                              Label
                            </label>
                            <Input
                              placeholder="Visible label"
                              value={field.label}
                              onChange={(event) =>
                                handleModuleFieldChange(field.id, 'label', event.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium uppercase text-gray-500">
                              Type
                            </label>
                            <Select
                              value={field.type}
                              onValueChange={(value: ModuleFieldType) =>
                                handleModuleFieldChange(field.id, 'type', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                                <SelectItem value="multiselect">Multi Select</SelectItem>
                                <SelectItem value="file">File Upload</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={field.required}
                              onCheckedChange={(checked) =>
                                handleModuleFieldChange(field.id, 'required', checked)
                              }
                            />
                            <span className="text-sm text-gray-600">Required</span>
                          </div>
                          {(field.type === 'select' || field.type === 'multiselect') && (
                            <div className="space-y-2 md:col-span-2 xl:col-span-4">
                              <label className="text-xs font-medium uppercase text-gray-500">
                                Options (comma separated)
                              </label>
                              <Input
                                placeholder="Option A, Option B, Option C"
                                value={field.options}
                                onChange={(event) =>
                                  handleModuleFieldChange(field.id, 'options', event.target.value)
                                }
                              />
                            </div>
                          )}
                          <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => removeModuleField(field.id)}
                              disabled={moduleDraft.fields.length === 1}
                            >
                              Remove field
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={resetModuleForm} disabled={savingModule}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={savingModule}>
                    {savingModule ? 'Creating module…' : 'Create module'}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing modules</CardTitle>
              <CardDescription>Modules available for this tenant.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-8 text-center text-gray-500">Loading modules…</p>
              ) : modules.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No modules created yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {modules.map((module) => (
                    <Card key={module.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        {module.description && (
                          <CardDescription>{module.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Fields</span>
                          <strong>{module.schema?.fields?.length ?? 0}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Views</span>
                          <strong>{module.views?.length ?? 1}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Status</span>
                          <strong className="capitalize">
                            {module.isActive === false ? 'Inactive' : 'Active'}
                          </strong>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase text-gray-500">Fields</p>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {(module.schema?.fields ?? []).map((field) => (
                              <li key={field.name}>
                                <span className="font-medium">{field.label}</span> ·{' '}
                                <span className="text-gray-500">{field.type}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Dashboard builder</CardTitle>
                <CardDescription>
                  Combine metrics, charts, and tables into tailored operational dashboards.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchStudioData} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
              </Button>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleCreateDashboard}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="dashboard-name">
                      Dashboard name
                    </label>
                    <Input
                      id="dashboard-name"
                      placeholder="e.g. Executive Overview"
                      value={dashboardDraft.name}
                      onChange={(event) =>
                        setDashboardDraft((draft) => ({ ...draft, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="dashboard-description">
                      Description
                    </label>
                    <Input
                      id="dashboard-description"
                      placeholder="Optional summary"
                      value={dashboardDraft.description}
                      onChange={(event) =>
                        setDashboardDraft((draft) => ({ ...draft, description: event.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="dashboard-default"
                      checked={dashboardDraft.isDefault}
                      onCheckedChange={(checked) =>
                        setDashboardDraft((draft) => ({ ...draft, isDefault: checked }))
                      }
                    />
                    <label htmlFor="dashboard-default" className="text-sm text-gray-600">
                      Set as default dashboard
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Widgets</h3>
                      <p className="text-sm text-gray-500">
                        Add visualizations to bring your data to life.
                      </p>
                    </div>
                    <Button type="button" variant="secondary" onClick={addDashboardWidget}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add widget
                    </Button>
                  </div>

                  {dashboardDraft.widgets.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-10 text-center text-sm text-gray-500">
                        No widgets yet. Add charts, metrics, or tables to design your dashboard.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {dashboardDraft.widgets.map((widget) => (
                        <Card key={widget.id} className="border border-gray-200">
                          <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase text-gray-500">
                                Title
                              </label>
                              <Input
                                placeholder="Widget title"
                                value={widget.title}
                                onChange={(event) =>
                                  updateDashboardWidget(widget.id, 'title', event.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase text-gray-500">
                                Data source (API, module, report)
                              </label>
                              <Input
                                placeholder="e.g. sales.orders"
                                value={widget.dataSource}
                                onChange={(event) =>
                                  updateDashboardWidget(widget.id, 'dataSource', event.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-medium uppercase text-gray-500">
                                Widget type
                              </label>
                              <Select
                                value={widget.type}
                                onValueChange={(value: WidgetType) =>
                                  updateDashboardWidget(widget.id, 'type', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="metric">Metric</SelectItem>
                                  <SelectItem value="chart">Chart</SelectItem>
                                  <SelectItem value="table">Table</SelectItem>
                                  <SelectItem value="list">List</SelectItem>
                                  <SelectItem value="calendar">Calendar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {widget.type === 'chart' ? (
                              <div className="space-y-2">
                                <label className="text-xs font-medium uppercase text-gray-500">
                                  Chart type
                                </label>
                                <Select
                                  value={widget.chartType ?? 'line'}
                                  onValueChange={(value: 'line' | 'bar' | 'pie' | 'area') =>
                                    updateDashboardWidget(widget.id, 'chartType', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select chart" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="line">Line</SelectItem>
                                    <SelectItem value="bar">Bar</SelectItem>
                                    <SelectItem value="pie">Pie</SelectItem>
                                    <SelectItem value="area">Area</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="text-xs font-medium uppercase text-gray-500">
                                  Metrics / columns (optional)
                                </label>
                                <Input
                                  placeholder="comma separated"
                                  value={widget.metrics ?? ''}
                                  onChange={(event) =>
                                    updateDashboardWidget(widget.id, 'metrics', event.target.value)
                                  }
                                />
                              </div>
                            )}
                            <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => removeDashboardWidget(widget.id)}
                              >
                                Remove widget
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                  <Button type="button" variant="ghost" onClick={resetDashboardForm} disabled={savingDashboard}>
                    Reset
                  </Button>
                  <Button type="submit" disabled={savingDashboard}>
                    {savingDashboard ? 'Creating dashboard…' : 'Create dashboard'}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Published dashboards</CardTitle>
              <CardDescription>Manage dashboards available to end users.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-8 text-center text-gray-500">Loading dashboards…</p>
              ) : dashboards.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No dashboards published yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {dashboards.map((dashboard) => (
                    <Card key={dashboard.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                          {dashboard.isDefault && (
                            <span className="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700">
                              Default
                            </span>
                          )}
                        </div>
                        {dashboard.description && (
                          <CardDescription>{dashboard.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Widgets</span>
                          <strong>{dashboard.widgets?.length ?? 0}</strong>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium uppercase text-gray-500">Widget summary</p>
                          <ul className="space-y-1 text-sm text-gray-600">
                            {(dashboard.widgets ?? []).map((widget) => (
                              <li key={widget.id}>
                                <span className="font-medium">{widget.title}</span> ·{' '}
                                <span className="text-gray-500">{widget.type}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow automation designer</CardTitle>
              <CardDescription>
                Orchestrate multi-step processes using triggers, conditions, and actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-3 lg:col-span-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="workflow-node-label">
                      Add workflow step
                    </label>
                    <Input
                      id="workflow-node-label"
                      placeholder="Step label"
                      value={newNodeLabel}
                      onChange={(event) => setNewNodeLabel(event.target.value)}
                    />
                  </div>
                  <Button type="button" onClick={handleAddWorkflowNode}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add node
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleSaveWorkflow}>
                    Save workflow
                  </Button>
                  {workflowSaved && (
                    <p className="text-sm font-medium text-teal-600">Workflow saved!</p>
                  )}
                  <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                    Drag connections between nodes to define execution order. Actions run in parallel
                    when multiple connections start from the same node.
                  </div>
                </div>
                <div className="lg:col-span-3">
                  <div className="h-[420px] rounded-lg border border-dashed border-gray-200 bg-white">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      fitView
                    >
                      <MiniMap />
                      <Controls />
                      <Background gap={16} size={1} />
                    </ReactFlow>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow JSON blueprint</CardTitle>
              <CardDescription>
                Exportable representation of the current workflow graph for auditing or deployment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-64 overflow-auto rounded-md bg-gray-900 p-4 text-xs text-gray-100">
{JSON.stringify(
  {
    nodes: nodes.map(({ id, data, position, type }) => ({ id, label: data?.label, position, type })),
    edges: edges.map(({ id, source, target }) => ({ id, source, target })),
  },
  null,
  2
)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  icon: typeof Layout;
  accent: string;
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${accent}`}>
          <Icon className="h-6 w-6 text-gray-800" />
        </div>
      </CardContent>
    </Card>
  );
}

