
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/public/export/config
export async function GET(request: NextRequest) {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.PUBLIC_API_KEY}`) {
        // For development/demo, if no env var is set, maybe allow it? 
        // Or strict? Let's be strict but log it.
        if (!process.env.PUBLIC_API_KEY) {
            console.warn('PUBLIC_API_KEY not set, allowing request for demo purposes (WARN)');
        } else {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    // 2. Tenant ID
    // In a real multi-tenant public API, the frontend might send a 'X-Tenant-ID' header
    // or the API Key might be mapped to a tenant. 
    // For this ERP, let's assume we maintain the context via a query param or header?
    // OR, if this ERP is single-tenant for the public site, we just fetch the first/only config?
    // Let's check query param `tenantId`.
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    try {
        const config = await prisma.exportStoreConfig.findUnique({
            where: { tenantId },
        });

        if (!config) {
            return NextResponse.json({ error: 'Config not found' }, { status: 404 });
        }

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
