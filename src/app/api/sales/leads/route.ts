import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/server/erp-context';

const client = prisma as any;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'view' });
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const search = searchParams.get('search');

    const leads = await client.lead.findMany({
      where: {
        tenantId,
        ...(statusParam && { status: statusParam }),
        ...(priorityParam && { priority: priorityParam }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }),
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads.map((lead: any) => ({
      ...lead,
      priority: lead.priority ?? 'MEDIUM',
      expectedRevenue: lead.expectedRevenue ?? null,
      probability: lead.probability ?? null,
    })));
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch leads' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'sales', action: 'create' });
    const body = await request.json();

    const lead = await client.lead.create({
      data: {
        name: body.name,
        email: body.email || '',
        phone: body.phone ?? null,
        source: body.source ?? null,
        status: body.status || 'NEW',
        priority: body.priority || 'MEDIUM',
        score: body.score ?? 0,
        probability: body.probability ?? null,
        expectedRevenue: body.expectedRevenue != null ? Number(body.expectedRevenue) : null,
        notes: body.notes ?? null,
        customerId: body.customerId ?? null,
        tenantId,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to create lead' }, { status });
  }
}

