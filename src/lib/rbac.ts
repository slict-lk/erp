/**
 * Role-Based Access Control (RBAC) System
 * Manages user permissions across the ERP system
 */

export enum Permission {
  // Sales & CRM
  SALES_VIEW = 'sales:view',
  SALES_CREATE = 'sales:create',
  SALES_EDIT = 'sales:edit',
  SALES_DELETE = 'sales:delete',
  
  // Accounting
  ACCOUNTING_VIEW = 'accounting:view',
  ACCOUNTING_CREATE = 'accounting:create',
  ACCOUNTING_EDIT = 'accounting:edit',
  ACCOUNTING_DELETE = 'accounting:delete',
  
  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_EDIT = 'inventory:edit',
  INVENTORY_DELETE = 'inventory:delete',
  
  // Manufacturing
  MANUFACTURING_VIEW = 'manufacturing:view',
  MANUFACTURING_CREATE = 'manufacturing:create',
  MANUFACTURING_EDIT = 'manufacturing:edit',
  MANUFACTURING_DELETE = 'manufacturing:delete',
  
  // HR
  HR_VIEW = 'hr:view',
  HR_CREATE = 'hr:create',
  HR_EDIT = 'hr:edit',
  HR_DELETE = 'hr:delete',
  
  // Projects
  PROJECTS_VIEW = 'projects:view',
  PROJECTS_CREATE = 'projects:create',
  PROJECTS_EDIT = 'projects:edit',
  PROJECTS_DELETE = 'projects:delete',
  
  // Admin
  USERS_MANAGE = 'users:manage',
  ROLES_MANAGE = 'roles:manage',
  SETTINGS_MANAGE = 'settings:manage',
  AUDIT_VIEW = 'audit:view',
  
  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_CREATE = 'reports:create',
  REPORTS_EXPORT = 'reports:export',
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

// Predefined system roles
export const SystemRoles = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    permissions: Object.values(Permission),
    isSystem: true,
  },
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access excluding system settings',
    permissions: [
      Permission.SALES_VIEW, Permission.SALES_CREATE, Permission.SALES_EDIT, Permission.SALES_DELETE,
      Permission.ACCOUNTING_VIEW, Permission.ACCOUNTING_CREATE, Permission.ACCOUNTING_EDIT, Permission.ACCOUNTING_DELETE,
      Permission.INVENTORY_VIEW, Permission.INVENTORY_CREATE, Permission.INVENTORY_EDIT, Permission.INVENTORY_DELETE,
      Permission.MANUFACTURING_VIEW, Permission.MANUFACTURING_CREATE, Permission.MANUFACTURING_EDIT, Permission.MANUFACTURING_DELETE,
      Permission.HR_VIEW, Permission.HR_CREATE, Permission.HR_EDIT, Permission.HR_DELETE,
      Permission.PROJECTS_VIEW, Permission.PROJECTS_CREATE, Permission.PROJECTS_EDIT, Permission.PROJECTS_DELETE,
      Permission.USERS_MANAGE,
      Permission.REPORTS_VIEW, Permission.REPORTS_CREATE, Permission.REPORTS_EXPORT,
    ],
    isSystem: true,
  },
  MANAGER: {
    name: 'Manager',
    description: 'Department manager with view and edit access',
    permissions: [
      Permission.SALES_VIEW, Permission.SALES_CREATE, Permission.SALES_EDIT,
      Permission.ACCOUNTING_VIEW,
      Permission.INVENTORY_VIEW, Permission.INVENTORY_CREATE, Permission.INVENTORY_EDIT,
      Permission.MANUFACTURING_VIEW, Permission.MANUFACTURING_CREATE, Permission.MANUFACTURING_EDIT,
      Permission.HR_VIEW,
      Permission.PROJECTS_VIEW, Permission.PROJECTS_CREATE, Permission.PROJECTS_EDIT,
      Permission.REPORTS_VIEW, Permission.REPORTS_CREATE,
    ],
    isSystem: true,
  },
  EMPLOYEE: {
    name: 'Employee',
    description: 'Standard employee with limited access',
    permissions: [
      Permission.SALES_VIEW,
      Permission.INVENTORY_VIEW,
      Permission.PROJECTS_VIEW,
      Permission.REPORTS_VIEW,
    ],
    isSystem: true,
  },
  ACCOUNTANT: {
    name: 'Accountant',
    description: 'Financial operations specialist',
    permissions: [
      Permission.ACCOUNTING_VIEW, Permission.ACCOUNTING_CREATE, Permission.ACCOUNTING_EDIT,
      Permission.SALES_VIEW,
      Permission.INVENTORY_VIEW,
      Permission.REPORTS_VIEW, Permission.REPORTS_CREATE, Permission.REPORTS_EXPORT,
    ],
    isSystem: true,
  },
  SALES_REP: {
    name: 'Sales Representative',
    description: 'Sales and CRM specialist',
    permissions: [
      Permission.SALES_VIEW, Permission.SALES_CREATE, Permission.SALES_EDIT,
      Permission.INVENTORY_VIEW,
      Permission.REPORTS_VIEW,
    ],
    isSystem: true,
  },
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: Permission[], required: Permission[]): boolean {
  return required.some(perm => userPermissions.includes(perm));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: Permission[], required: Permission[]): boolean {
  return required.every(perm => userPermissions.includes(perm));
}

/**
 * Get permission category from permission string
 */
export function getPermissionCategory(permission: Permission): string {
  return permission.split(':')[0];
}

/**
 * Get permission action from permission string
 */
export function getPermissionAction(permission: Permission): string {
  return permission.split(':')[1];
}

/**
 * Format permission for display
 */
export function formatPermission(permission: Permission): string {
  const [category, action] = permission.split(':');
  const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
  const formattedAction = action.charAt(0).toUpperCase() + action.slice(1);
  return `${formattedCategory} - ${formattedAction}`;
}

/**
 * Group permissions by category
 */
export function groupPermissionsByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);
}
