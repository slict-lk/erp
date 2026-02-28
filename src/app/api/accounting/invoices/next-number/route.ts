import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const tenant = await getOrCreateDefaultTenant();

        // TODO: Replace with server-driven sequence backed by database counters
        // For now, generating a collision-safe ID securely on the server using a full UUID
        const sequenceNumber = `INV-${crypto.randomUUID().toUpperCase()}`;

        return NextResponse.json({ number: sequenceNumber });
    } catch (error) {
        console.error('Failed to generate next invoice number:', error);
        return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }
}
