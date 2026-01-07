import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // TEMPORARY: Find the first tenant for development if auth is not fully set up
        // In production, get tenantId from session
        const tenant = await prisma.tenant.findFirst({
            include: { sparePartsConfig: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        let config = tenant.sparePartsConfig[0];

        // Auto-provision if missing (copied from public route logic)
        if (!config) {
            config = await prisma.sparePartsConfig.create({
                data: {
                    tenantId: tenant.id,
                    storeName: tenant.name || 'Auto Parts Store',
                    logoUrl: tenant.logo || '',
                    primaryColor: tenant.primaryColor || '#C8102E',
                    secondaryColor: '#1E3A5F',
                    heroSlides: [],
                }
            });
        }

        // Merge Tenant Settings
        const s = (tenant.settings as any) || {};

        const mergedConfig = {
            ...config,
            // Map settings to flat response
            contactEmail: s.contactEmail || config.contactEmail,
            contactPhone: s.contactPhone || config.contactPhone,
            address: s.address || config.address,
            facebookUrl: s.facebookUrl || config.facebookUrl,
            instagramUrl: s.instagramUrl || config.instagramUrl,

            // New fields from settings
            aboutUs: s.aboutUs || {},
            businessHours: s.businessHours || {},
            mapUrl: s.mapUrl || '',
            whatsappNumber: s.whatsappNumber || '',
            linkedinUrl: s.linkedinUrl || '',
        };

        return NextResponse.json(mergedConfig);
    } catch (error) {
        console.error("Config fetch error:", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, tenantId, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'Config ID required' }, { status: 400 });
        }

        // Separate fields for SparePartsConfig vs Tenant.settings
        const configFields = ['storeName', 'tagline', 'primaryColor', 'secondaryColor', 'logoUrl', 'heroSlides', 'banners', 'featuredCategories', 'currency', 'taxRate'];

        const configData: any = {};
        const settingsData: any = {};

        Object.keys(data).forEach(key => {
            if (configFields.includes(key)) {
                configData[key] = data[key];
            } else {
                settingsData[key] = data[key];
            }
        });

        // 1. Update SparePartsConfig
        const updatedConfig = await prisma.sparePartsConfig.update({
            where: { id },
            data: configData
        });

        // 2. Update Tenant Settings
        // We need to fetch current settings first to merge deeply if needed, or just merge top level
        const tenant = await prisma.tenant.findUnique({ where: { id: updatedConfig.tenantId } });
        if (tenant) {
            const currentSettings = (tenant.settings as any) || {};

            // Construct new settings object
            // Map flat API fields back to structured settings JSON
            const newSettings = {
                ...currentSettings,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                address: data.address,
                facebookUrl: data.facebookUrl,
                instagramUrl: data.instagramUrl,
                linkedinUrl: data.linkedinUrl,
                whatsappNumber: data.whatsappNumber,
                mapUrl: data.mapUrl,

                aboutUs: data.aboutUs || currentSettings.aboutUs,
                businessHours: data.businessHours || currentSettings.businessHours,
            };

            await prisma.tenant.update({
                where: { id: tenant.id },
                data: {
                    name: data.storeName, // Sync store name to tenant name
                    primaryColor: data.primaryColor, // Sync core branding
                    logo: data.logoUrl,
                    settings: newSettings
                }
            });
        }

        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error("Config update error:", error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
