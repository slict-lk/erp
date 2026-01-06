import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/spareparts/config?subdomain=...
 * Returns the SparePartsConfig for the given subdomain.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subdomain = searchParams.get('subdomain');

        if (!subdomain) {
            return NextResponse.json(
                { error: 'Subdomain is required' },
                { status: 400 }
            );
        }

        // 1. Find Tenant by subdomain
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain },
            select: {
                id: true,
                subdomain: true,
                name: true,
                logo: true,
                primaryColor: true,
                companyName: true,
            }
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Store not found' },
                { status: 404 }
            );
        }

        // 2. Find or create SparePartsConfig for this tenant
        // Use 'any' cast if Typescript client isn't fully updated in IDE but DB has schema
        let config = await prisma.sparePartsConfig.findUnique({
            where: { tenantId: tenant.id }
        });

        // Auto-provision if missing
        if (!config) {
            // Default demo data
            config = await prisma.sparePartsConfig.create({
                data: {
                    tenantId: tenant.id,
                    storeName: tenant.name || 'Auto Parts Store',
                    logoUrl: tenant.logo,
                    primaryColor: tenant.primaryColor || '#C8102E',
                    secondaryColor: '#1E3A5F',
                    currency: 'LKR',
                    heroSlides: [
                        {
                            id: '1',
                            imageUrl: '',
                            title: 'Top Quality Aftermarket Parts',
                            subtitle: 'Turbochargers & Engine Components',
                            buttonText: 'Shop Now',
                            buttonLink: '/products'
                        }
                    ],
                    benefits: [
                        { icon: 'Truck', title: 'Island-wide Delivery', description: 'Within 24 hours' },
                        { icon: 'Shield', title: 'Quality Guarantee', description: 'Original & Aftermarket' }
                    ]
                }
            });
        }

        return NextResponse.json({
            tenantId: tenant.id,
            subdomain: tenant.subdomain,
            config: config
        });

    } catch (error: any) {
        console.error('Error fetching spare parts config:', error);
        return NextResponse.json(
            { error: 'Failed to fetch store configuration' },
            { status: 500 }
        );
    }
}
