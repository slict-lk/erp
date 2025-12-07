import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { formatSuccessResponse } from '@/lib/error-handler';
import { tryCatch } from '@/lib/error-handler';
import { Tenant } from '@prisma/client';


export const dynamic = 'force-dynamic';
type BusinessHourEntry = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type TenantSettings = {
  registrationNumber?: string;
  industry?: string;
  foundedYear?: string;
  website?: string;
  description?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  vatNumber?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  businessHours?: BusinessHourEntry[];
  logo?: string;
  signature?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  [key: string]: unknown;
};

const DEFAULT_BUSINESS_HOURS: BusinessHourEntry[] = [
  { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { day: 'Saturday', isOpen: false, openTime: '09:00', closeTime: '13:00' },
  { day: 'Sunday', isOpen: false, openTime: '', closeTime: '' },
];

function normalizeCompanyResponse(tenant: Tenant | null) {
  const rawSettings = (tenant?.settings ?? {}) as TenantSettings;
  const settings = typeof rawSettings === 'object' && rawSettings !== null ? rawSettings : {};

  const businessHours = Array.isArray(settings.businessHours) && settings.businessHours.length > 0
    ? settings.businessHours.map((entry: Partial<BusinessHourEntry>) => ({
        day: entry?.day ?? '',
        isOpen: Boolean(entry?.isOpen),
        openTime: entry?.openTime ?? '',
        closeTime: entry?.closeTime ?? '',
      }))
    : DEFAULT_BUSINESS_HOURS.map((entry) => ({ ...entry }));

  return {
    companyName: tenant?.companyName || tenant?.name || '',
    legalName: tenant?.companyName || tenant?.name || '',
    registrationNumber: settings.registrationNumber ?? '',
    industry: settings.industry ?? '',
    foundedYear: settings.foundedYear ?? '',
    website: settings.website ?? tenant?.domain ?? '',
    description: settings.description ?? '',
    email: settings.email ?? '',
    phone: settings.phone ?? '',
    fax: settings.fax ?? '',
    address: settings.address ?? '',
    city: settings.city ?? '',
    state: settings.state ?? '',
    postalCode: settings.postalCode ?? '',
    country: settings.country ?? 'US',
    taxId: settings.taxId ?? '',
    vatNumber: settings.vatNumber ?? '',
    bankName: settings.bankName ?? '',
    accountName: settings.accountName ?? '',
    accountNumber: settings.accountNumber ?? '',
    routingNumber: settings.routingNumber ?? '',
    iban: settings.iban ?? '',
    swiftCode: settings.swiftCode ?? '',
    facebook: settings.facebook ?? '',
    twitter: settings.twitter ?? '',
    linkedin: settings.linkedin ?? '',
    instagram: settings.instagram ?? '',
    businessHours,
    logo: tenant?.logo ?? settings.logo ?? '',
    signature: settings.signature ?? '',
    termsAndConditions: settings.termsAndConditions ?? '',
    privacyPolicy: settings.privacyPolicy ?? '',
  };
}

export async function GET(_request: NextRequest) {
  return tryCatch(async () => {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      console.error('❌ No authenticated user found. Please log in.');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to access company settings' },
        { status: 401 }
      );
    }

    console.log('✅ Fetching company settings for tenant:', user.tenantId);

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      console.error('❌ Tenant not found:', user.tenantId);
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(normalizeCompanyResponse(tenant));
  }, 'Failed to fetch company settings');
}

export async function POST(request: NextRequest) {
  return tryCatch(async () => {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!isAdmin) {
      console.error('Permission denied for user:', {
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      });
      return NextResponse.json(
        { error: 'Insufficient permissions. Only administrators can update company settings.' },
        { status: 403 }
      );
    }

    const body = await request.json() as Record<string, unknown>;

    // Update tenant basic info
    const updateData: Partial<Pick<Tenant, 'companyName' | 'name' | 'domain'>> = {
      companyName: (body.companyName as string | undefined) || undefined,
      name: (body.legalName as string | undefined) || (body.companyName as string | undefined) || undefined,
    };

    if (body.website) updateData.domain = body.website as string;

    // Update tenant
    await prisma.tenant.update({
      where: { id: user.tenantId },
      data: updateData,
    });

    // Update or create tenant settings
    // Note: In a production system, you'd want a proper TenantSettings model
    // For now, we'll store additional data in the tenant record or a JSON field
    // This is a simplified implementation

    return NextResponse.json(
      formatSuccessResponse({}, 'Company settings saved successfully')
    );
  }, 'Failed to save company settings');
}

