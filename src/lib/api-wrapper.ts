import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { Permission } from './rbac';
import { handleApiError, UnauthorizedError, ForbiddenError } from './error-handler';
import { getOrCreateDefaultTenant } from './get-tenant';

type ApiHandler = (
    req: NextRequest,
    context: { user: any; tenantId: string; params: any }
) => Promise<NextResponse>;

/**
 * API Wrapper to enforce Authentication, Multi-tenancy, and RBAC
 */
export function withAuth(handler: ApiHandler, requiredPermission?: Permission) {
    return async (req: NextRequest, { params }: { params: any }) => {
        try {
            // 1. Authenticate User
            const user = await getCurrentUser();
            if (!user) {
                throw new UnauthorizedError('Authentication required');
            }

            // 2. Resolve Tenant
            // In a real SaaS, this would be strictly from the user's session or subdomain
            // For this ERP, we use the user's tenantId or the default fallback
            const tenantId = user.tenantId;
            if (!tenantId) {
                throw new ForbiddenError('No tenant associated with this user');
            }

            // 3. Enforce RBAC
            if (requiredPermission) {
                const isAdmin = user.role === 'ADMIN' || user.isSuperAdmin;
                const enabledModuleIds = user.enabledModuleIds || [];

                // Extract module name from permission (e.g., 'sales' from 'sales:view')
                const moduleName = requiredPermission.split(':')[0];

                if (!isAdmin && !enabledModuleIds.includes(moduleName)) {
                    throw new ForbiddenError(`Module not enabled or missing required permission: ${requiredPermission}`);
                }
            }

            // 4. Execute Handler
            return await handler(req, { user, tenantId, params });
        } catch (error: any) {
            return handleApiError(error);
        }
    };
}
