import { User as PrismaUser } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      tenantId: string;
      tenant: string;
      role: string | null;
      isSuperAdmin: boolean;
      enabledModuleIds: string[];
      modulePermissions?: Record<string, any>;
      employee?: any;
      image?: string | null;
      trialEnd?: string | null;
      plan?: string;
    };
  }

  interface User extends Partial<PrismaUser> {
    tenant: string;
    role: string | null;
    isSuperAdmin: boolean;
    modulePermissions: Record<string, any>;
    employee?: any;
    trialEnd?: string | null;
    plan?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    tenantId: string;
    tenant: string;
    role: string | null;
    isSuperAdmin: boolean;
    enabledModuleIds: string[];
    modulePermissions?: Record<string, any>;
    employee?: any;
    trialEnd?: string | null;
    plan?: string;
  }
}
