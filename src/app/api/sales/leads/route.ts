import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';


export const dynamic = 'force-dynamic';
// GET /api/sales/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const search = searchParams.get('search');

    const leads = await prisma.lead.findMany({
      where: {
        tenantId: tenant.id,
        ...(statusParam && { status: statusParam as 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'WON' | 'LOST' }),
        ...(priorityParam && { priority: priorityParam as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// POST /api/sales/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const tenant = await getOrCreateDefaultTenant();
    const body = await request.json();

    const lead = await prisma.lead.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: body.source,
        status: body.status || 'NEW',
        score: body.score || 0,
        notes: body.notes,
        customerId: body.customerId,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

