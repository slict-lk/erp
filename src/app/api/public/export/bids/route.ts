// Public API: POST /api/public/export/bids
// Allows customers to place bids from the external "Kobemotor" website

import { NextRequest, NextResponse } from 'next/server';
import { createBid } from '@/apps/vehicle-export/api';
import { z } from 'zod';

// Simple API key validation
function validateApiKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.EXPORT_PUBLIC_API_KEY;

    if (!expectedKey) return true;
    return apiKey === expectedKey;
}

// Request validation schema
const bidSchema = z.object({
    tenantId: z.string().min(1, 'Tenant ID is required'),
    customerEmail: z.string().email('Valid email is required'),
    customerName: z.string().min(1, 'Customer name is required'),
    vehicleId: z.string().optional(),
    requestedMake: z.string().min(1, 'Make is required'),
    requestedModel: z.string().min(1, 'Model is required'),
    maxBudget: z.number().positive('Budget must be positive'),
    currency: z.string().optional().default('JPY'),
    notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Validate API key
        if (!validateApiKey(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate body
        const body = await request.json();
        const validationResult = bidSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.flatten().fieldErrors
                },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Create the bid
        const bid = await createBid({
            tenantId: data.tenantId,
            customerEmail: data.customerEmail,
            customerName: data.customerName,
            vehicleId: data.vehicleId,
            requestedMake: data.requestedMake,
            requestedModel: data.requestedModel,
            maxBudget: data.maxBudget,
            currency: data.currency,
            notes: data.notes,
        });

        // TODO: Send notification to Sales Team dashboard
        // This could be implemented via Pusher, SSE, or polling

        return NextResponse.json({
            success: true,
            message: 'Bid submitted successfully',
            bid: {
                id: bid.id,
                status: bid.status,
                requestedMake: bid.requestedMake,
                requestedModel: bid.requestedModel,
                maxBudget: Number(bid.maxBudget),
                currency: bid.currency,
                createdAt: bid.createdAt,
            },
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating bid:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
