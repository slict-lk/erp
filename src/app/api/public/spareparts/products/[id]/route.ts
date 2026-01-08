import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQuantityPromotions } from '@/apps/spareparts/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/spareparts/products/[id]
 * Fetch a single product by ID or slug for the storefront SSR
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const subdomain = searchParams.get('subdomain');

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
        }

        // Resolve tenant
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain },
            select: { id: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Find product by ID (also check if it matches the tenant)
        const product = await (prisma as any).sparePart.findFirst({
            where: {
                id: id,
                tenantId: tenant.id,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                category: true,
                brand: true,
                salePrice: true,
                costPrice: true,
                qtyAvailable: true,
                images: true,
                isActive: true,
                compatibleModels: true,
                aliases: {
                    select: {
                        aliasCode: true,
                        description: true,
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Get quantity promotions
        const promotions = await getQuantityPromotions(product.id, tenant.id);

        // Transform to public format
        const publicProduct = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description || '',
            category: product.category || '',
            brand: product.brand || '',
            salePrice: Number(product.salePrice) || 0,
            stockQty: product.qtyAvailable || 0,
            images: product.images || [],
            compatibleModels: product.compatibleModels || [],
            aliases: product.aliases || [],
            quantityDiscounts: promotions.map((p: any) => ({
                minQuantity: p.minQuantity,
                discountType: p.discountType,
                discountValue: Number(p.discountValue),
            })),
        };

        return NextResponse.json(publicProduct);
    } catch (error) {
        console.error('[API] Error fetching product:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
