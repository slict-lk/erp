import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { tryCatch, formatSuccessResponse } from '@/lib/error-handler';
import { getCustomModules, createCustomModule } from '@/apps/studio/api';

export async function GET(req: Request) {
  return tryCatch(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getOrCreateDefaultTenant();
    const { searchParams } = new URL(req.url);

    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const take = parseInt(searchParams.get('take') || '50', 10);
    const search = searchParams.get('search') || undefined;
    const isActive = searchParams.has('isActive') ? searchParams.get('isActive') === 'true' : undefined;

    const result = await getCustomModules(tenant.id, { skip, take, search, isActive });

    const resp = formatSuccessResponse(result.data);
    return NextResponse.json({ ...resp, meta: { count: result.count, skip: result.skip, take: result.take } });
  });
}

export async function POST(req: Request) {
  return tryCatch(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getOrCreateDefaultTenant();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Module name is required' }, { status: 400 });
    }

    const module = await createCustomModule(tenant.id, body, session.user.id);
    return NextResponse.json(formatSuccessResponse(module), { status: 201 });
  });
}
