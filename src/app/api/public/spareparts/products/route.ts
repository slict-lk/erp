import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/spareparts/products
 * Query Params: subdomain, category, brand, search, page, limit
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const subdomain = searchParams.get('subdomain');
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { subdomain },
            select: { id: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Build where clause
        const where: any = {
            tenantId: tenant.id,
            isActive: true,
        };

        if (category && category !== 'All') {
            where.category = category; // Exact match for now
        }

        if (brand && brand !== 'All') {
            where.brand = brand;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { partNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Execute query
        // Using 'any' for counts if client types aren't regenerated
        const [products, total] = await Promise.all([
            prisma.sparePart.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.sparePart.count({ where })
        ]);

        return NextResponse.json({
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching spare parts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
