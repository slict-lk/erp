import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { tryCatch, formatSuccessResponse } from '@/lib/error-handler';
import { getExecutions, getWorkflowById } from '@/apps/studio/workflow-api';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return tryCatch(async () => {
    const { id } = await ctx.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenant = await getOrCreateDefaultTenant();

    const workflow = await getWorkflowById(id, tenant.id);
    if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '50', 10);
    const status = searchParams.get('status') || undefined;

    const result = await getExecutions(id, { skip, take, status });
    const resp = formatSuccessResponse(result.data);
    return NextResponse.json({ ...resp, meta: { count: result.count, skip: result.skip, take: result.take } });
  });
}
