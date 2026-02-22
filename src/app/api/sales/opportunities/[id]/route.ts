import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';

const client = prisma as any;
export const dynamic = 'force-dynamic';

function normalizeOpportunity(opportunity: any) {
  return {
    ...opportunity,
    expectedRevenue: opportunity.expectedRevenue ?? opportunity.amount ?? 0,
    expectedCloseDate: opportunity.expectedCloseDate ?? opportunity.closeDate ?? null,
  };
}

async function attachRelations(item: any) {
  if (!item) return item;
  const [customer, lead] = await Promise.all([
    item.customerId
      ? client.customer.findFirst({
          where: { id: item.customerId },
          select: { id: true, name: true, email: true, phone: true },
        })
      : Promise.resolve(null),
    item.leadId
      ? client.lead.findFirst({
          where: { id: item.leadId },
          select: { id: true, name: true, email: true, status: true },
        })
      : Promise.resolve(null),
  ]);

  return { ...item, customer, lead };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { id } = await params;
    const item = await client.opportunity.findFirst({
      where: { id, tenantId },
    });
    if (!item) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    return NextResponse.json(normalizeOpportunity(await attachRelations(item)));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch opportunity' }, { status });
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
    const existing = await client.opportunity.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });

    const item = await client.opportunity.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        ...(body.expectedRevenue !== undefined && {
          amount: Number(body.expectedRevenue),
          expectedRevenue: Number(body.expectedRevenue),
        }),
        ...(body.probability !== undefined && { probability: Number(body.probability) }),
        ...(body.stage !== undefined && { stage: String(body.stage).toUpperCase() }),
        ...(body.expectedCloseDate !== undefined && {
          expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
          closeDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        }),
        ...(body.customerId !== undefined && { customerId: body.customerId }),
        ...(body.leadId !== undefined && { leadId: body.leadId }),
        ...(body.ownerUserId !== undefined && { ownerUserId: body.ownerUserId }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
      },
    });

    return NextResponse.json(normalizeOpportunity(await attachRelations(item)));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to update opportunity' }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'delete' });
    const { id } = await params;
    const existing = await client.opportunity.findFirst({ where: { id, tenantId } });
    if (!existing) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    await client.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to delete opportunity' }, { status });
  }
}
