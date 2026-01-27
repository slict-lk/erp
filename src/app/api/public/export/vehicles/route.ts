// Public API: GET /api/public/export/vehicles
// Returns published vehicles for the external "Kobemotor" website

import { NextRequest, NextResponse } from 'next/server';
import { getPublicVehicles } from '@/apps/vehicle-export/api';

// Simple API key validation (can be enhanced with proper auth)
function validateApiKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.EXPORT_PUBLIC_API_KEY;

    // If no key is configured, allow access (dev mode)
    if (!expectedKey) return true;

    return apiKey === expectedKey;
}

export async function GET(request: NextRequest) {
    try {
        // Validate API key
        if (!validateApiKey(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant ID from query params or header
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || request.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Tenant ID is required' },
                { status: 400 }
            );
        }

        // Optional filters
        const make = searchParams.get('make') || undefined;
        const model = searchParams.get('model') || undefined;
        const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

        // Get public vehicles
        const vehicles = await getPublicVehicles(tenantId);

        // Apply filters if provided
        let filtered = vehicles;
        if (make) {
            filtered = filtered.filter(v => v.make.toLowerCase().includes(make.toLowerCase()));
        }
        if (model) {
            filtered = filtered.filter(v => v.model.toLowerCase().includes(model.toLowerCase()));
        }
        if (minPrice !== undefined) {
            filtered = filtered.filter(v => v.fobPrice >= minPrice);
        }
        if (maxPrice !== undefined) {
            filtered = filtered.filter(v => v.fobPrice <= maxPrice);
        }

        return NextResponse.json({
            success: true,
            count: filtered.length,
            vehicles: filtered,
        });
    } catch (error) {
        console.error('Error fetching public vehicles:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
