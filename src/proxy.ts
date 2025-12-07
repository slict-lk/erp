import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Map routes to module IDs
const ROUTE_TO_MODULE_ID_MAP: Record<string, string> = {
  '/sales': 'sales',
  '/accounting': 'accounting',
  '/inventory': 'inventory',
  '/hr': 'hr',
  '/purchasing': 'purchasing',
  '/manufacturing': 'manufacturing',
  '/projects': 'projects',
  '/reports': 'reports',
  '/settings/users': 'users',
  '/settings': 'settings',
  '/contacts': 'contacts',
  '/subscriptions': 'subscriptions',
  '/quality': 'quality',
  '/marketing': 'marketing',
  '/blog': 'blog',
  '/surveys': 'surveys',
  '/helpdesk': 'helpdesk',
  '/pos': 'pos',
  '/cart': 'cart',
  '/loyalty': 'loyalty',
  '/properties': 'properties',
  '/agents': 'agents',
  '/healthcare': 'healthcare',
  '/hotel': 'hotel',
  '/restaurant': 'restaurant',
  '/livechat': 'livechat',
  '/sms': 'sms',
  '/calendar': 'calendar',
  '/courses': 'courses',
  '/knowledge': 'knowledge',
  '/forum': 'forum',
  '/presentations': 'presentations',
  '/automation': 'automation',
  '/integrations': 'integrations',
  '/studio': 'studio',
  '/ai': 'ai',
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const hostname = req.headers.get('host') || '';

    // Tenant subdomain handling
    const hostParts = hostname.split('.');
    const requestHeaders = new Headers(req.headers);

    if (hostname.includes('localhost')) {
      const subdomain = hostParts[0].split(':')[0];
      requestHeaders.set('x-tenant-subdomain', subdomain);
    } else if (hostParts.length >= 3) {
      const subdomain = hostParts[0];
      const reserved = ['www', 'api', 'admin', 'app'];
      if (!reserved.includes(subdomain)) {
        requestHeaders.set('x-tenant-subdomain', subdomain);
      }
    }

    // Super Admin bypass
    if (token?.isSuperAdmin) {
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // Check module permissions
    for (const [route, moduleId] of Object.entries(ROUTE_TO_MODULE_ID_MAP)) {
      if (path.startsWith(route)) {
        const enabledModuleIds = (token?.enabledModuleIds as string[]) || [];

        // Dashboard is always accessible
        if (moduleId === 'dashboard') continue;

        if (!enabledModuleIds.includes(moduleId)) {
          return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
        }
        break;
      }
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Match all request paths except:
    // 1. /api/auth (NextAuth)
    // 2. /_next (Next.js internals)
    // 3. /_static (inside /public)
    // 4. /login (Public login page)
    // 5. /register (Public register page - if enabled)
    // 6. all root files inside /public (e.g. /favicon.ico)
    '/((?!api/auth|_next/|_static/|login|register|favicon.ico).*)',
  ],
};
