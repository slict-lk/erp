"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
    CustomModule,
    CustomModuleField,
    CustomRecord,
    StudioDashboard,
    DashboardWidget,
    StudioWorkflow,
    WorkflowExecution,
} from '@/apps/studio/types';

// Generic fetcher
async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'API Request failed');
    return json.data !== undefined ? json.data : json; // Handles wrapper if present
}

export function useModules(params?: { skip?: number; take?: number; search?: string }) {
    const queryList = new URLSearchParams(params as any).toString();
    return useQuery({
        queryKey: ['studio', 'modules', params],
        queryFn: () => fetcher<CustomModule[]>(`/api/studio/modules?${queryList}`)
    });
}

export function useModule(id: string) {
    return useQuery({
        queryKey: ['studio', 'modules', id],
        queryFn: () => fetcher<CustomModule>(`/api/studio/modules/${id}`),
        enabled: !!id
    });
}

export function useModuleFields(moduleId: string) {
    return useQuery({
        queryKey: ['studio', 'modules', moduleId, 'fields'],
        queryFn: () => fetcher<CustomModuleField[]>(`/api/studio/modules/${moduleId}/fields`),
        enabled: !!moduleId
    });
}

export function useRecords(moduleId: string, params?: { skip?: number; take?: number; search?: string }) {
    const queryList = new URLSearchParams(params as any).toString();
    return useQuery({
        queryKey: ['studio', 'modules', moduleId, 'records', params],
        queryFn: () => fetcher<CustomRecord[]>(`/api/studio/modules/${moduleId}/records?${queryList}`),
        enabled: !!moduleId
    });
}

export function useRecord(moduleId: string, recordId: string) {
    return useQuery({
        queryKey: ['studio', 'modules', moduleId, 'records', recordId],
        queryFn: () => fetcher<CustomRecord>(`/api/studio/modules/${moduleId}/records/${recordId}`),
        enabled: !!moduleId && !!recordId
    });
}

export function useDashboards() {
    return useQuery({
        queryKey: ['studio', 'dashboards'],
        queryFn: () => fetcher<StudioDashboard[]>('/api/studio/dashboards')
    });
}

export function useDashboard(id: string) {
    return useQuery({
        queryKey: ['studio', 'dashboards', id],
        queryFn: () => fetcher<StudioDashboard>(`/api/studio/dashboards/${id}`),
        enabled: !!id
    });
}

export function useWidgets(dashboardId: string) {
    return useQuery({
        queryKey: ['studio', 'dashboards', dashboardId, 'widgets'],
        queryFn: () => fetcher<DashboardWidget[]>(`/api/studio/dashboards/${dashboardId}/widgets`),
        enabled: !!dashboardId
    });
}

export function useWorkflows() {
    return useQuery({
        queryKey: ['studio', 'workflows'],
        queryFn: () => fetcher<StudioWorkflow[]>('/api/studio/workflows')
    });
}

export function useWorkflow(id: string) {
    return useQuery({
        queryKey: ['studio', 'workflows', id],
        queryFn: () => fetcher<StudioWorkflow>(`/api/studio/workflows/${id}`),
        enabled: !!id
    });
}

export function useAutomations() {
    return useQuery({
        queryKey: ['studio', 'automation'],
        queryFn: () => fetcher<any[]>('/api/studio/automation')
    });
}

export function useAutomation(id: string) {
    return useQuery({
        queryKey: ['studio', 'automation', id],
        queryFn: () => fetcher<any>(`/api/studio/automation/${id}`),
        enabled: !!id
    });
}

// Mutations
export function useCreateRecordMutation(moduleId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher(`/api/studio/modules/${moduleId}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio', 'modules', moduleId, 'records'] })
    });
}

export function useUpdateRecordMutation(moduleId: string, recordId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher(`/api/studio/modules/${moduleId}/records/${recordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studio', 'modules', moduleId, 'records'] });
            queryClient.invalidateQueries({ queryKey: ['studio', 'modules', moduleId, 'records', recordId] });
        }
    });
}

export function useDeleteRecordMutation(moduleId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (recordId: string) => fetcher(`/api/studio/modules/${moduleId}/records/${recordId}`, {
            method: 'DELETE',
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio', 'modules', moduleId, 'records'] })
    });
}

export function useUpdateWorkflowMutation(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher(`/api/studio/workflows/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio', 'workflows'] })
    });
}

export function useUpdateAutomationMutation(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher(`/api/studio/automation/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio', 'automation'] })
    });
}

export function useCreateDashboardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher('/api/studio/dashboards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio', 'dashboards'] })
    });
}

export function useUpdateDashboardMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => fetcher(`/api/studio/dashboards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['studio', 'dashboards'] });
            queryClient.invalidateQueries({ queryKey: ['studio', 'dashboards', id] });
        }
    });
}

