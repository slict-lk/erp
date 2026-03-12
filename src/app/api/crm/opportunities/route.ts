import { NextRequest, NextResponse } from 'next/server';
import { createOpportunity, listOpportunities } from '@/apps/crm/api';
import { publishModuleMutationEvent } from '@/lib/ai/module-events';
import { requireTenantContext } from '@/lib/server/erp-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const oppCreateSchema = z.object({
  name: z.string().min(1, 'name is required'),
  pipelineId: z.string().optional(),
  stageId: z.string().optional(),
  amount: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).optional(),
}).passthrough();

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantContext({ moduleId: 'crm', action: 'view' });
    const { searchParams } = new URL(request.url);
    const data = await listOpportunities(tenantId, {
      status: searchParams.get('status') || undefined,
      pipelineId: searchParams.get('pipelineId') || undefined,
      stageId: searchParams.get('stageId') || undefined,
      search: searchParams.get('search') || undefined,
    });

    return NextResponse.json({ data, metadata: { count: data.length } });
  } catch (error: any) {
    const status = error?.message?.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'Forbidden' : 'Failed to fetch opportunities' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, user } = await requireTenantContext({ moduleId: 'crm', action: 'create' });
    const body = await request.json();
    const parsedData = oppCreateSchema.parse(body);

    const opportunity = await createOpportunity(tenantId, user.id, parsedData);
    try {
      await publishModuleMutationEvent({
        tenantId,
        module: 'crm',
        entity: 'opportunity',
        event: 'created',
        actorId: user.id,
        payload: {
          opportunityId: opportunity.id,
          name: opportunity.name,
          status: opportunity.status,
        },
      });
    } catch (publishError) {
      console.error('Failed to publish opportunity mutation event:', { tenantId, opportunityId: opportunity.id, userId: user.id, error: publishError });
    }
    return NextResponse.json({ data: opportunity }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    const message = String(error?.message || '');
    const status = message.includes('Forbidden')
      ? 403
      : /invalid|restricted|not allowed|requires approval/i.test(message)
        ? 400
        : 500;
    return NextResponse.json(
      {
        error:
          status === 403 ? 'Forbidden' : status === 500 ? 'Failed to create opportunity' : message || 'Invalid request',
      },
      { status }
    );
  }
}
