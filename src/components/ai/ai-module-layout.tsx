"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/ai', label: 'Overview' },
  { href: '/ai/inbox', label: 'Approvals' },
  { href: '/ai/workflows', label: 'Workflows' },
  { href: '/ai/agents', label: 'Agents' },
  { href: '/ai/copilots', label: 'Copilots' },
  { href: '/ai/events', label: 'Events' },
  { href: '/ai/policies', label: 'Policies' },
  { href: '/ai/models', label: 'Models' },
  { href: '/ai/prompts', label: 'Prompts' },
  { href: '/ai/integrations', label: 'Integrations' },
  { href: '/ai/analytics', label: 'Analytics' },
  { href: '/ai/audit', label: 'Audit' },
  { href: '/ai/settings', label: 'Settings' },
];

export function AIModuleLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f7fbff_0%,#f8fafc_18%,#f8fafc_100%)]">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Unified Hub</p>
              <h1 className="text-xl font-semibold text-slate-950">AI & Automation</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm">
                <Link href="/ai/workflows/new">New Workflow</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/ai/agents/new">New Agent</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/ai/policies">Policy Center</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/ai/inbox">Approvals</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/ai/settings?panel=diagnostics">Run Diagnostics</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <nav className="flex min-w-max gap-2 pb-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === '/ai'
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-sky-600 bg-sky-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
      <div className="px-4 md:px-6">{children}</div>
    </div>
  );
}
