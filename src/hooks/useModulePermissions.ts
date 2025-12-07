/**
 * React Hook for Module Permissions
 * Use this hook in your components to check module permissions
 */

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { hasModulePermission, getEnabledModules } from '@/lib/modules';

export interface ModulePermission {
  enabled: boolean;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export?: boolean;
  import?: boolean;
  approve?: boolean;
}

export function useModulePermissions() {
  const { data: session } = useSession();
  const user = session?.user;

  const modulePermissions = useMemo(() => {
    // Use enabledModuleIds from session
    const enabledIds = user?.enabledModuleIds || [];
    const permissions: Record<string, ModulePermission> = {};

    enabledIds.forEach(id => {
      permissions[id] = {
        enabled: true,
        view: true, // Implicit view permission for enabled modules
        create: false, // Default to false, can be enhanced later if needed
        edit: false,
        delete: false,
      };
    });

    return permissions;
  }, [user]);

  /**
   * Check if user has a specific permission for a module
   */
  const can = (
    moduleId: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'import' | 'approve'
  ): boolean => {
    return hasModulePermission(modulePermissions, moduleId, action);
  };

  /**
   * Check if a module is enabled for the user
   */
  const isModuleEnabled = (moduleId: string): boolean => {
    const permission = modulePermissions[moduleId];
    return permission?.enabled === true;
  };

  /**
   * Get all enabled modules for the user
   */
  const enabledModules = useMemo(() => {
    return getEnabledModules(modulePermissions);
  }, [modulePermissions]);

  /**
   * Get permission object for a specific module
   */
  const getModulePermission = (moduleId: string): ModulePermission | null => {
    return modulePermissions[moduleId] || null;
  };

  /**
   * Check if user is admin (has elevated privileges)
   */
  const isAdmin = user?.role === 'ADMIN' || user?.isSuperAdmin === true;

  /**
   * Check if user is manager
   */
  const isManager = user?.role === 'MANAGER';

  /**
   * Get user's role
   */
  const role = user?.role as 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | undefined;

  return {
    can,
    isModuleEnabled,
    enabledModules,
    getModulePermission,
    modulePermissions,
    isAdmin,
    isManager,
    role,
    user,
  };
}

/**
 * Hook to check specific module permissions
 * @param moduleId - The module ID to check
 * @returns Object with permission flags
 */
export function useModuleAccess(moduleId: string) {
  const { can, isModuleEnabled, getModulePermission } = useModulePermissions();

  const permission = getModulePermission(moduleId);

  return {
    enabled: isModuleEnabled(moduleId),
    canView: can(moduleId, 'view'),
    canCreate: can(moduleId, 'create'),
    canEdit: can(moduleId, 'edit'),
    canDelete: can(moduleId, 'delete'),
    canExport: can(moduleId, 'export'),
    canImport: can(moduleId, 'import'),
    canApprove: can(moduleId, 'approve'),
    permission,
  };
}

