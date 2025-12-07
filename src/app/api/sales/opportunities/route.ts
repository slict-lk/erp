import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/sales/opportunities - Get all opportunities
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');

    const client = prisma as any;

    const opportunities = await client.opportunity.findMany({
      where: {
        tenantId: tenant.id,
        ...(stage && { stage }),
        ...(search && {
          name: { contains: search, mode: 'insensitive' },
        }),
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

// POST /api/sales/opportunities - Create new opportunity
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const opportunity = await prisma.opportunity.create({
      data: {
        name: body.name,
        description: body.description,
        amount: body.amount,
        probability: body.probability || 50,
        stage: (body.stage || 'PROSPECTING').toUpperCase(),
        closeDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        customerId: body.customerId,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}

