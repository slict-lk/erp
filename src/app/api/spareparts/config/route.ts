import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    // Admin API to fetch config (can reuse public logic but authenticated)
    // For now, let's just use the public one in the frontend or implement fetching here
    try {
        const { searchParams } = new URL(req.url);
        const subdomain = searchParams.get('subdomain');

        // In a real app, we'd get the tenant from the session
        // const session = await getServerSession(authOptions);

        // Mocking finding the config for the tenant
        // Default to a known tenant or find one
        const config = await prisma.sparePartsConfig.findFirst({
            include: {
                tenant: true
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
        }

        const updated = await prisma.sparePartsConfig.update({
            where: { id },
            data: data
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Config update error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
