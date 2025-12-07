import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

// GET /api/sales/leads/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getOrCreateDefaultTenant();
    
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        customer: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
  }
}

// PUT /api/sales/leads/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: body.source,
        status: body.status,
        score: body.score,
        notes: body.notes,
        customerId: body.customerId,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// DELETE /api/sales/leads/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getOrCreateDefaultTenant();

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
