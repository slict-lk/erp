import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/projects/tasks - Get all tasks
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const priority = searchParams.get('priority') as any;
    const projectId = searchParams.get('projectId');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');

    const tasks = await prisma.task.findMany({
      where: {
        tenantId: tenant.id,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(projectId && { projectId }),
        ...(assigneeId && { assigneeId }),
        ...(search && {
          title: { contains: search, mode: 'insensitive' },
        }),
      },
      include: {
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/projects/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: (body.status as any) || 'TODO',
        priority: (body.priority as any) || 'MEDIUM',
        projectId: body.projectId,
        assigneeId: body.assigneeId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        estimatedHours: body.estimatedHours,
        tenantId: tenant.id,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

