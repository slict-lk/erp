import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExportStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET /api/public/seed-vehicles - Create sample vehicles for testing
export async function GET(request: NextRequest) {
    try {
        // Find slict tenant
        const tenant = await prisma.tenant.findUnique({
            where: { subdomain: 'slict' }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Slict tenant not found. Create it first.' }, { status: 404 });
        }

        const sampleVehicles = [
            {
                stockNumber: 'SL-2026-0001',
                chassisNumber: 'JZX100-0123456',
                make: 'Toyota',
                model: 'Mark II',
                year: 1998,
                color: 'White',
                fuelType: 'Petrol',
                transmission: 'Automatic',
                mileage: 85000,
                engineCc: 2500,
                steering: 'RHD',
                fobPrice: 8500,
                currency: 'USD',
                status: ExportStatus.IN_YARD,
                isPublished: true,
                location: 'Yokohama Yard',
                auctionGrade: '4.5',
            },
            {
                stockNumber: 'SL-2026-0002',
                chassisNumber: 'GRS182-0045678',
                make: 'Toyota',
                model: 'Crown Athlete',
                year: 2006,
                color: 'Black',
                fuelType: 'Petrol',
                transmission: 'Automatic',
                mileage: 92000,
                engineCc: 3000,
                steering: 'RHD',
                fobPrice: 12500,
                currency: 'USD',
                status: ExportStatus.IN_YARD,
                isPublished: true,
                location: 'Yokohama Yard',
                auctionGrade: '4',
            },
            {
                stockNumber: 'SL-2026-0003',
                chassisNumber: 'ZN6-0087654',
                make: 'Toyota',
                model: '86 GT',
                year: 2015,
                color: 'Red',
                fuelType: 'Petrol',
                transmission: 'Manual',
                mileage: 45000,
                engineCc: 2000,
                steering: 'RHD',
                fobPrice: 18000,
                currency: 'USD',
                status: ExportStatus.IN_YARD,
                isPublished: true,
                location: 'Osaka Yard',
                auctionGrade: '4.5',
            },
            {
                stockNumber: 'SL-2026-0004',
                chassisNumber: 'BNR34-0012345',
                make: 'Nissan',
                model: 'Skyline GT-R V-Spec',
                year: 2001,
                color: 'Midnight Purple',
                fuelType: 'Petrol',
                transmission: 'Manual',
                mileage: 68000,
                engineCc: 2600,
                steering: 'RHD',
                fobPrice: 85000,
                currency: 'USD',
                status: ExportStatus.IN_YARD,
                isPublished: true,
                location: 'Yokohama Yard',
                auctionGrade: '5',
            },
            {
                stockNumber: 'SL-2026-0005',
                chassisNumber: 'FD3S-0098765',
                make: 'Mazda',
                model: 'RX-7 Spirit R',
                year: 2002,
                color: 'Yellow',
                fuelType: 'Petrol',
                transmission: 'Manual',
                mileage: 52000,
                engineCc: 1300,
                steering: 'RHD',
                fobPrice: 45000,
                currency: 'USD',
                status: ExportStatus.IN_YARD,
                isPublished: true,
                location: 'Osaka Yard',
                auctionGrade: '4.5',
            },
            {
                stockNumber: 'SL-2026-0006',
                chassisNumber: 'JZA80-0567890',
                make: 'Toyota',
                model: 'Supra RZ',
                year: 1997,
                color: 'White',
                fuelType: 'Petrol',
                transmission: 'Manual',
                mileage: 78000,
                engineCc: 3000,
                steering: 'RHD',
                fobPrice: 95000,
                currency: 'USD',
                status: ExportStatus.IN_YARD,
                isPublished: true,
                location: 'Yokohama Yard',
                auctionGrade: '4.5',
            },
        ];

        const createdVehicles = [];

        for (const v of sampleVehicles) {
            // Check if already exists
            const existing = await prisma.exportVehicle.findFirst({
                where: { tenantId: tenant.id, stockNumber: v.stockNumber }
            });

            if (!existing) {
                const vehicle = await prisma.exportVehicle.create({
                    data: {
                        tenantId: tenant.id,
                        ...v,
                    },
                });

                // Add a sample photo
                await prisma.exportVehiclePhoto.create({
                    data: {
                        vehicleId: vehicle.id,
                        url: `https://placehold.co/800x600/1a1a1a/white?text=${encodeURIComponent(v.make + ' ' + v.model)}`,
                        tag: 'exterior',
                        isPublic: true,
                    },
                });

                createdVehicles.push(vehicle);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Created ${createdVehicles.length} vehicles`,
            vehicles: createdVehicles.map(v => ({ id: v.id, stockNumber: v.stockNumber })),
        });

    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Seed failed', details: String(error) }, { status: 500 });
    }
}
