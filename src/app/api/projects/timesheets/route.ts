import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/projects/timesheets - Get all project timesheets
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');

    const timesheets = await prisma.timesheet.findMany({
      where: {
        tenantId: tenant.id,
        ...(projectId && { projectId }),
        ...(employeeId && { employeeId }),
        ...(date && {
          date: new Date(date),
        }),
      },
      include: {
        employee: true,
        project: true,
        task: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(timesheets);
  } catch (error) {
    console.error('Error fetching project timesheets:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheets' }, { status: 500 });
  }
}

// POST /api/projects/timesheets - Create new project timesheet
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId: body.employeeId,
        projectId: body.projectId,
        taskId: body.taskId,
        date: new Date(body.date),
        hours: body.hours,
        description: body.description,
        tenantId: tenant.id,
      },
      include: {
        employee: true,
        project: true,
        task: true,
      },
    });

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    return NextResponse.json({ error: 'Failed to create timesheet' }, { status: 500 });
  }
}

