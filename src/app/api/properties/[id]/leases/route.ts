import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/properties/[id]/leases - Create a lease
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['tenantName', 'tenantEmail', 'startDate', 'endDate', 'monthlyRent'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const lease = await prisma.propertyLease.create({
      data: {
        propertyId: id,
        tenantName: body.tenantName,
        tenantEmail: body.tenantEmail,
        tenantPhone: body.tenantPhone || null,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        monthlyRent: parseFloat(body.monthlyRent),
        securityDeposit: body.securityDeposit ? parseFloat(body.securityDeposit) : null,
        status: body.status || 'ACTIVE',
        contractUrl: body.contractUrl || null,
      },
    });

    return NextResponse.json(lease, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lease:', error);
    return NextResponse.json(
      { error: 'Failed to create lease', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/properties/[id]/leases - Get all leases for a property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const leases = await prisma.propertyLease.findMany({
      where: {
        propertyId: id,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leases);
  } catch (error: any) {
    console.error('Error fetching leases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leases', details: error.message },
      { status: 500 }
    );
  }
}
