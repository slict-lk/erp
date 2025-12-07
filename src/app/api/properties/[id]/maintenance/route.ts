import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/properties/[id]/maintenance - Create a maintenance request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description'];
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

    const maintenance = await prisma.propertyMaintenance.create({
      data: {
        propertyId: id,
        title: body.title,
        description: body.description,
        priority: body.priority || 'MEDIUM',
        status: body.status || 'PENDING',
        assignedTo: body.assignedTo || null,
        cost: body.cost ? parseFloat(body.cost) : null,
      },
    });

    return NextResponse.json(maintenance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating maintenance request:', error);
    return NextResponse.json(
      { error: 'Failed to create maintenance request', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/properties/[id]/maintenance - Get all maintenance requests for a property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const maintenances = await prisma.propertyMaintenance.findMany({
      where: {
        propertyId: id,
        ...(status && { status }),
        ...(priority && { priority: priority as any }),
      },
      orderBy: { reportedAt: 'desc' },
    });

    return NextResponse.json(maintenances);
  } catch (error: any) {
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests', details: error.message },
      { status: 500 }
    );
  }
}
