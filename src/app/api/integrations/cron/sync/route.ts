import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { formatSuccessResponse, tryCatch } from '@/lib/error-handler';
import { jobQueue } from '@/lib/jobs/queue';
import { isSessionOrCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return tryCatch(async () => {
    const isAuthorized = await isSessionOrCronAuthorized(request);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');

    if (integrationId) {
      const success = await jobQueue.triggerSync(integrationId);

      if (success) {
        return NextResponse.json(
          formatSuccessResponse({}, 'Integration sync triggered successfully')
        );
      }

      return NextResponse.json({ error: 'Failed to trigger sync' }, { status: 400 });
    }

    const status = jobQueue.getStatus();
    const logs = await prisma.integrationLog.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(
      formatSuccessResponse({
        queue: status,
        recentLogs: logs,
      })
    );
  }, 'Failed to manage sync jobs');
}
