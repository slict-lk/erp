import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { handleApiError, formatSuccessResponse, formatPaginatedResponse } from '@/lib/error-handler';
import { tryCatch } from '@/lib/error-handler';


export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return tryCatch(async () => {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as any;
    const departmentId = searchParams.get('departmentId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.id,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          _count: {
            select: {
              attendances: true,
              expenses: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json(
      formatPaginatedResponse(employees, page, limit, total)
    );
  }, 'Failed to fetch employees');
}

export async function POST(request: NextRequest) {
  return tryCatch(async () => {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId: body.employeeId || `EMP${Date.now()}`,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        position: body.position,
        hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
        type: (body.type as any) || 'FULL_TIME',
        departmentId: body.departmentId,
        salary: body.salary,
        isActive: body.isActive !== undefined ? body.isActive : true,
        tenantId: tenant.id,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(
      formatSuccessResponse(employee, 'Employee created successfully'),
      { status: 201 }
    );
  }, 'Failed to create employee');
}

