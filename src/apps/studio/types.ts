// PHASE 3: No-Code Studio Module Types

export interface CustomModule {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  schema: ModuleSchema;
  views: ModuleView[];
  isActive: boolean;
}

export interface ModuleSchema {
  fields: CustomField[];
  relations: CustomRelation[];
}

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'file' | 'json';
  label: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select fields
  validation?: FieldValidation;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string; // custom validation function
}

export interface CustomRelation {
  name: string;
  targetModule: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
}

export interface ModuleView {
  type: 'list' | 'form' | 'kanban' | 'calendar' | 'chart';
  name: string;
  config: ViewConfig;
}

export interface ViewConfig {
  fields?: string[];
  filters?: Filter[];
  sorts?: Sort[];
  groupBy?: string;
  layout?: any;
}

export interface Filter {
  field: string;
  operator: string;
  value: any;
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CustomRecord {
  id: string;
  moduleId: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  isDefault: boolean;
}

export interface DashboardLayout {
  cols: number;
  rows: number;
  items: LayoutItem[];
}

export interface LayoutItem {
  widgetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'list' | 'calendar';
  title: string;
  dataSource: string;
  config: WidgetConfig;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  metrics?: string[];
  dimensions?: string[];
  filters?: Filter[];
  refreshInterval?: number;
}

export interface WorkflowBuilder {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'branch';
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowConnection {
  source: string;
  target: string;
  condition?: string;
}
