import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProductQuantityDiscounts } from '@/apps/spareparts/api';



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

        // Find product by ID or SKU
        // Find product by ID or SKU
        let product = await (prisma as any).sparePart.findFirst({
            where: {
                tenantId: tenant.id,
                isActive: true,
                OR: [
                    { id: id },
                    { sku: id }
                ]
            },
            select: {
                id: true,
                name: true,
                sku: true,
                description: true,
                category: true,
                costPrice: true,

                stockQty: true,
                images: true,
                isActive: true,
                compatibleModels: true,
                aliases: {
                    select: {
                        aliasNumber: true,
                        brand: true,
                    },
                },
            },
        });

        // Fallback: If not found, try to match by Name (Slug-like behavior)
        // e.g. "chery-qq-engine-valve-inlet" -> "Chery QQ Engine Valve Inlet"
        if (!product && id.includes('-')) {
            const nameFromSlug = id.replace(/-/g, ' ');
            product = await (prisma as any).sparePart.findFirst({
                where: {
                    tenantId: tenant.id,
                    isActive: true, // we might want to show out of stock, but must be active
                    name: {
                        equals: nameFromSlug,
                        mode: 'insensitive' // case-insensitive match
                    }
                },
                select: {
                    id: true,
                    name: true,
                    sku: true,
                    description: true,
                    category: true,
                    costPrice: true,

                    stockQty: true,
                    images: true,
                    isActive: true,
                    compatibleModels: true,
                    aliases: {
                        select: {
                            aliasNumber: true,
                            brand: true,
                        },
                    },
                },
            });
        }

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Get quantity promotions
        const promotions = await getProductQuantityDiscounts(tenant.id, product.id, product.category);

        // Transform to public format
        const publicProduct = {
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description || '',
            category: product.category || '',
            brand: product.brand || '',
            salePrice: Number(product.salePrice) || 0,
            stockQty: Number(product.stockQty) || 0,
            images: product.images || [],
            compatibleModels: product.compatibleModels || [],
            aliases: product.aliases || [],
            quantityDiscounts: promotions.map((p: any) => ({
                promotionName: p.promotionName,
                minQuantity: p.minQuantity,
                maxQuantity: p.maxQuantity,
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
