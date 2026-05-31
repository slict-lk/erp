import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runScheduledIntelligencePipelines } from '@/lib/intelligence/runtime/runtime-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runScheduledIntelligencePipelines(prisma);
    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Scheduled intelligence run failed.',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
