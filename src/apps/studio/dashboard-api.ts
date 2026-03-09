import { prisma } from '@/lib/prisma';
import {
    CreateDashboardInput,
    UpdateDashboardInput,
    CreateWidgetInput,
    UpdateWidgetInput,
    PaginationParams,
    PaginatedResponse,
    StudioDashboard
} from './types';
import { Prisma } from '@prisma/client';

export interface DashboardFilters extends PaginationParams {
    search?: string;
    isPublished?: boolean;
}

// ----------------------------------------------------------------------------
// DASHBOARDS
// ----------------------------------------------------------------------------

export async function getDashboards(
    tenantId: string,
    filters?: DashboardFilters
): Promise<PaginatedResponse<StudioDashboard>> {
    const { skip = 0, take = 50, search, isPublished, sortBy = 'createdAt', sortOrder = 'desc' } = filters || {};

    const where: Prisma.StudioDashboardWhereInput = {
        tenantId,
        ...(isPublished !== undefined && { isPublished }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };

    const [count, data] = await Promise.all([
        prisma.studioDashboard.count({ where }),
        prisma.studioDashboard.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            include: {
                widgets: true,
            },
        }),
    ]);

    return {
        data: data as unknown as StudioDashboard[],
        count,
        skip,
        take
    };
}

export async function getDashboardById(id: string, tenantId: string): Promise<StudioDashboard | null> {
    const dashboard = await prisma.studioDashboard.findFirst({
        where: { id, tenantId },
        include: {
            widgets: true,
        },
    });

    if (!dashboard) return null;
    return dashboard as unknown as StudioDashboard;
}

export async function createDashboard(
    tenantId: string,
    input: CreateDashboardInput,
    createdById?: string
): Promise<StudioDashboard> {
    // If setting this one to default, unset others first
    if (input.isDefault) {
        await prisma.studioDashboard.updateMany({
            where: { tenantId, isDefault: true },
            data: { isDefault: false },
        });
    }

    const dashboard = await prisma.studioDashboard.create({
        data: {
            tenantId,
            name: input.name,
            description: input.description,
            icon: input.icon || 'layout-dashboard',
            layout: input.layout as any,
            isDefault: input.isDefault ?? false,
            isPublished: input.isPublished ?? true,
            createdById,
        },
    });

    return dashboard as unknown as StudioDashboard;
}

export async function updateDashboard(
    id: string,
    tenantId: string,
    data: UpdateDashboardInput
): Promise<StudioDashboard> {
    // If setting this one to default, unset others first
    if (data.isDefault === true) {
        await prisma.studioDashboard.updateMany({
            where: { tenantId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const updated = await prisma.studioDashboard.update({
        where: { id },
        data: {
            name: data.name,
            description: data.description,
            icon: data.icon,
            layout: data.layout as any,
            isDefault: data.isDefault,
            isPublished: data.isPublished,
        },
        include: {
            widgets: true,
        }
    });

    return updated as unknown as StudioDashboard;
}

export async function deleteDashboard(id: string, tenantId: string) {
    // Verify ownership before deleting
    const dashboard = await prisma.studioDashboard.findFirst({
        where: { id, tenantId },
    });

    if (!dashboard) throw new Error('Dashboard not found');

    return prisma.studioDashboard.delete({
        where: { id },
    });
}

// ----------------------------------------------------------------------------
// DASHBOARD WIDGETS
// ----------------------------------------------------------------------------

export async function getDashboardWidgets(dashboardId: string) {
    return prisma.dashboardWidget.findMany({
        where: { dashboardId },
        orderBy: { createdAt: 'asc' },
    });
}

export async function createDashboardWidget(dashboardId: string, data: CreateWidgetInput) {
    return prisma.dashboardWidget.create({
        data: {
            dashboardId,
            title: data.title,
            type: data.type,
            dataSource: data.dataSource,
            config: data.config as any,
            position: data.position as any,
        },
    });
}

export async function updateDashboardWidget(id: string, data: UpdateWidgetInput) {
    return prisma.dashboardWidget.update({
        where: { id },
        data: {
            title: data.title,
            type: data.type,
            dataSource: data.dataSource,
            config: data.config as any,
            position: data.position as any,
        },
    });
}

export async function deleteDashboardWidget(id: string) {
    return prisma.dashboardWidget.delete({
        where: { id },
    });
}
