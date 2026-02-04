
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/public/export/customer/profile
// POST /api/public/export/customer/profile (Update)
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (process.env.PUBLIC_API_KEY && authHeader !== `Bearer ${process.env.PUBLIC_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');
    const email = searchParams.get('email');

    if (!subdomain || !email) {
        return NextResponse.json({ error: 'Subdomain and Email required' }, { status: 400 });
    }

    try {
        const tenant = await prisma.tenant.findFirst({
            where: { OR: [{ subdomain }, { domain: subdomain }] },
            select: { id: true }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const customer = await prisma.exportCustomer.findFirst({
            where: { tenantId: tenant.id, email }
        });

        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (process.env.PUBLIC_API_KEY && authHeader !== `Bearer ${process.env.PUBLIC_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { subdomain, email, name, phone, address, company, country } = body;

        if (!subdomain || !email) {
            return NextResponse.json({ error: 'Subdomain and Email required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findFirst({
            where: { OR: [{ subdomain }, { domain: subdomain }] },
            select: { id: true }
        });

        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const customer = await prisma.exportCustomer.updateMany({
            where: { tenantId: tenant.id, email },
            data: {
                name,
                phone,
                address,
                company,
                country
            }
        });

        return NextResponse.json({ success: true, count: customer.count });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
