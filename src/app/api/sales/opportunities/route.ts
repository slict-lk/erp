import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';
import { z } from 'zod';

const client = prisma as any;
export const dynamic = 'force-dynamic';

const oppCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  amount: z.union([z.number(), z.string()]).optional(),
  expectedRevenue: z.union([z.number(), z.string()]).optional(),
  probability: z.union([z.number(), z.string()]).optional(),
  stage: z.string().optional(),
  closeDate: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  ownerUserId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
}).passthrough();

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
    const items = hydrated.map(normalizeOpportunity);
    return NextResponse.json({ items, metadata: { count: items.length } });
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
    const parsed = oppCreateSchema.parse(body);

    const opportunity = await client.opportunity.create({
      data: {
        name: parsed.name,
        description: parsed.description ?? null,
        amount: Number(parsed.amount ?? parsed.expectedRevenue ?? 0),
        expectedRevenue: parsed.expectedRevenue != null ? Number(parsed.expectedRevenue) : Number(parsed.amount ?? 0),
        probability: Number(parsed.probability ?? 50),
        stage: mapStage(parsed.stage) || 'QUALIFICATION',
        closeDate: parsed.closeDate ? new Date(parsed.closeDate) : (parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : null),
        expectedCloseDate: parsed.expectedCloseDate ? new Date(parsed.expectedCloseDate) : (parsed.closeDate ? new Date(parsed.closeDate) : null),
        customerId: parsed.customerId ?? null,
        leadId: parsed.leadId ?? null,
        tenantId,
        ownerUserId: parsed.ownerUserId ?? null,
        branchId: parsed.branchId ?? null,
      },
      include: {
        customer: true,
        lead: true,
      },
    });

    return NextResponse.json({ data: normalizeOpportunity(opportunity) }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create opportunity' }, { status });
  }
}
