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
      employee?: any;
      image?: string | null;
    };
  }

  interface User extends Partial<PrismaUser> {
    tenant: string;
    role: string | null;
    isSuperAdmin: boolean;
    modulePermissions: Record<string, any>; // Keep full object for User interface as it comes from DB
    employee?: any;
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
    employee?: any;
  }
}
