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
    const search = searchParams.get('search');
    const typeParam = searchParams.get('type');

    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { taxId: { contains: search } },
      ];
    }

    if (typeParam && typeParam !== 'ALL') {
      where.type = typeParam as 'INDIVIDUAL' | 'COMPANY';
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          leads: {
            select: {
              id: true,
              name: true,
              status: true,
              score: true,
            },
          },
          salesOrders: {
            select: {
              id: true,
              number: true,
              status: true,
              total: true,
            },
          },
          invoices: {
            select: {
              id: true,
              number: true,
              status: true,
              total: true,
            },
          },
          _count: {
            select: {
              leads: true,
              salesOrders: true,
              invoices: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json(
      formatPaginatedResponse(customers, page, limit, total)
    );
  }, 'Failed to fetch customers');
}

export async function POST(request: NextRequest) {
  return tryCatch(async () => {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if customer with this email already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: body.email,
        tenantId: tenant.id,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        type: body.type || 'INDIVIDUAL',
        address: body.street ?? body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country || 'US',
        tenantId: tenant.id,
      },
      include: {
        leads: true,
        salesOrders: true,
        invoices: true,
        _count: {
          select: {
            leads: true,
            salesOrders: true,
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json(
      formatSuccessResponse(customer, 'Customer created successfully'),
      { status: 201 }
    );
  }, 'Failed to create customer');
}

