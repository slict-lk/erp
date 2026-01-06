import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ slug: string }> } // Expecting { slug: string }
) {
    try {
        const { searchParams } = new URL(request.url);
        const subdomain = searchParams.get('subdomain');
        const { slug } = await context.params;

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain },
            select: { id: true }
        });

        if (!tenant) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

        // Find product by ID (slug passed from frontend is currently mapped to ID)
        // OR by SKU if we change logic later. For now assume slug = id or sku.
        const product = await prisma.sparePart.findFirst({
            where: {
                tenantId: tenant.id,
                OR: [
                    { id: slug },
                    { sku: slug } // Fallback if slug is SKU
                ]
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);

    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
