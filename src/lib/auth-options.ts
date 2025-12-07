import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',  // Use JWT for session management
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Demo account bypass
        if (credentials.email === 'demo@slict.lk' && credentials.password === 'demo@slict') {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              tenant: true,
              // @ts-ignore
              employee: true,
            },
          });

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'USER',
              isSuperAdmin: user.isSuperAdmin,
              modulePermissions: (user.modulePermissions as Record<string, any>) || {},
              tenantId: user.tenantId,
              tenant: user.tenant?.name ?? 'Default',
              employee: (user as any).employee,
            };
          }
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            tenant: true,
            // @ts-ignore
            employee: true,
          },
        });

        if (!user || !user.password || !user.isActive) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Determine user role: prioritize isSuperAdmin, then use database role field, default to USER
        const userRole = user.isSuperAdmin ? 'ADMIN' : (user.role || 'USER');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: userRole,
          isSuperAdmin: user.isSuperAdmin,
          modulePermissions: (user.modulePermissions as Record<string, any>) || {},
          tenantId: user.tenantId,
          tenant: user.tenant?.name ?? 'Default',
          employee: (user as any).employee,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign in, store user data in token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isSuperAdmin = user.isSuperAdmin || false;

        // Optimize JWT: Store only enabled module IDs
        const permissions = (user.modulePermissions as Record<string, any>) || {};
        token.enabledModuleIds = Object.keys(permissions).filter(key => permissions[key]?.enabled);

        token.tenantId = user.tenantId as string;
        token.tenant = user.tenant;
        token.employee = user.employee;
      }

      // On subsequent requests, refresh user data from database to get latest role AND permissions
      if (token.id && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isSuperAdmin: true,
              tenantId: true,
              modulePermissions: true,
              // @ts-ignore
              employee: true,
              tenant: {
                select: {
                  name: true,
                  companyName: true,
                }
              }
            }
          });

          if (dbUser) {
            // Update token with fresh data from database
            const userRole = dbUser.isSuperAdmin ? 'ADMIN' : (dbUser.role || 'USER');
            token.role = userRole;
            token.isSuperAdmin = dbUser.isSuperAdmin || false;

            // Optimize JWT: Store only enabled module IDs
            const permissions = (dbUser.modulePermissions as Record<string, any>) || {};
            token.enabledModuleIds = Object.keys(permissions).filter(key => permissions[key]?.enabled);

            token.tenantId = dbUser.tenantId;
            token.tenant = dbUser.tenant?.name ?? dbUser.tenant?.companyName ?? 'Default';
            token.employee = (dbUser as any).employee;
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string | null) ?? null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.enabledModuleIds = token.enabledModuleIds as string[];
        session.user.tenantId = token.tenantId as string;
        session.user.tenant = token.tenant as string;
        session.user.employee = token.employee;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Custom sign in page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Re-export for convenience
export { getServerSession } from 'next-auth';
