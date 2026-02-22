import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';

const client = prisma as any;
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { id } = await params;

    const lead = await client.lead.findFirst({
      where: { id, tenantId },
      include: { customer: true },
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch lead' }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'edit' });
    const { id } = await params;
    const body = await request.json();

    const existingLead = await client.lead.findFirst({ where: { id, tenantId } });
    if (!existingLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const lead = await client.lead.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email || '' }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.score !== undefined && { score: Number(body.score) || 0 }),
        ...(body.probability !== undefined && {
          probability: body.probability == null ? null : Number(body.probability),
        }),
        ...(body.expectedRevenue !== undefined && {
          expectedRevenue: body.expectedRevenue == null ? null : Number(body.expectedRevenue),
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.customerId !== undefined && { customerId: body.customerId }),
      },
    });

    return NextResponse.json(lead);
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to update lead' }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'delete' });
    const { id } = await params;
    const existingLead = await client.lead.findFirst({ where: { id, tenantId } });
    if (!existingLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    await client.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete lead' }, { status });
  }
}

