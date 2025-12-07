import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant';
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');

    const where: any = { tenantId };
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const surveys = await prisma.survey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(surveys);
  } catch (error: any) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id') || 'default-tenant';
    const data = await req.json();

    const survey = await prisma.survey.create({
      data: {
        title: data.title,
        description: data.description,
        questions: data.questions || [],
        isActive: data.isActive ?? true,
        tenantId,
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error: any) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

