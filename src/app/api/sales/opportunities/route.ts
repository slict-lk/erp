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
    stage: opportunity.stage,
  };
}

function mapStage(stage?: string | null) {
  if (!stage) return undefined;
  return stage.toUpperCase();
}

async function attachRelations(opportunities: any[]) {
  if (opportunities.length === 0) return opportunities;

  const customerIds = Array.from(new Set(opportunities.map((o) => o.customerId).filter(Boolean)));
  const leadIds = Array.from(new Set(opportunities.map((o) => o.leadId).filter(Boolean)));

  const [customers, leads] = await Promise.all([
    customerIds.length
      ? client.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, email: true, phone: true },
        })
      : Promise.resolve([]),
    leadIds.length
      ? client.lead.findMany({
          where: { id: { in: leadIds } },
          select: { id: true, name: true, email: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const customerMap = new Map(customers.map((c: any) => [c.id, c]));
  const leadMap = new Map(leads.map((l: any) => [l.id, l]));

  return opportunities.map((o) => ({
    ...o,
    customer: o.customerId ? customerMap.get(o.customerId) ?? null : null,
    lead: o.leadId ? leadMap.get(o.leadId) ?? null : null,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');

    const opportunities = await client.opportunity.findMany({
      where: {
        tenantId,
        ...(stage && { stage: mapStage(stage) }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    const hydrated = await attachRelations(opportunities);
    return NextResponse.json(hydrated.map(normalizeOpportunity));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch opportunities' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'create' });
    const body = await request.json();

    const opportunity = await client.opportunity.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        amount: Number(body.amount ?? body.expectedRevenue ?? 0),
        expectedRevenue: body.expectedRevenue != null ? Number(body.expectedRevenue) : Number(body.amount ?? 0),
        probability: Number(body.probability ?? 50),
        stage: mapStage(body.stage) || 'QUALIFICATION',
        closeDate: body.closeDate ? new Date(body.closeDate) : (body.expectedCloseDate ? new Date(body.expectedCloseDate) : null),
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : (body.closeDate ? new Date(body.closeDate) : null),
        customerId: body.customerId ?? null,
        leadId: body.leadId ?? null,
        tenantId,
        ownerUserId: body.ownerUserId ?? null,
        branchId: body.branchId ?? null,
      },
      include: {
        customer: true,
        lead: true,
      },
    });

    return NextResponse.json(normalizeOpportunity(opportunity), { status: 201 });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create opportunity' }, { status });
  }
}
