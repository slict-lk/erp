import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';
import { tryCatch, formatSuccessResponse } from '@/lib/error-handler';
import { getCustomModuleById } from '@/apps/studio/api';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
    return tryCatch(async () => {
  const { id } = await ctx.params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const tenant = await getOrCreateDefaultTenant();
        const body: { fieldIds: string[] } = await req.json();

        if (!Array.isArray(body.fieldIds)) {
            return NextResponse.json({ error: 'fieldIds array is required' }, { status: 400 });
        }

        const module = await getCustomModuleById(tenant.id, id);
        if (!module) return NextResponse.json({ error: 'Module not found' }, { status: 404 });

        // Verify all field IDs belong to this module before reordering
        const moduleFields = await prisma.customModuleField.findMany({
            where: { moduleId: module.id },
            select: { id: true },
        });
        const validFieldIds = new Set(moduleFields.map(f => f.id));
        const invalidIds = body.fieldIds.filter(fid => !validFieldIds.has(fid));
        if (invalidIds.length > 0) {
            return NextResponse.json({ error: 'Some field IDs do not belong to this module' }, { status: 400 });
        }

        for (let i = 0; i < body.fieldIds.length; i++) {
            await prisma.customModuleField.update({
                where: { id: body.fieldIds[i] },
                data: { sequence: i }
            });
        }

        return NextResponse.json(formatSuccessResponse({ success: true, message: 'Fields reordered successfully' }));
    });
}
