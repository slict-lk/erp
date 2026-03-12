"use client";

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, ChartColumn, Home, Settings2, ShieldCheck, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AIExperienceMode } from '@/lib/ai/control-plane-types';
import { AIExperienceProvider } from '@/components/ai/ai-experience-context';

type TopLevelSection = 'home' | 'tasks' | 'automations' | 'assistants' | 'insights' | 'admin';

type SectionConfig = {
  key: TopLevelSection;
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  matches: string[];
  children: Array<{ label: string; href: string }>;
};

const SECTIONS: SectionConfig[] = [
  {
    key: 'home',
    label: 'Home',
    description: 'Command center, onboarding, and quick actions.',
    href: '/ai',
    icon: Home,
    matches: ['/ai'],
    children: [{ label: 'Command Center', href: '/ai' }],
  },
  {
    key: 'tasks',
    label: 'Tasks',
    description: 'Approvals, issues, and operational follow-up.',
    href: '/ai/tasks',
    icon: ShieldCheck,
    matches: ['/ai/tasks', '/ai/inbox', '/ai/events'],
    children: [
      { label: 'Tasks Overview', href: '/ai/tasks' },
      { label: 'Approvals', href: '/ai/inbox' },
      { label: 'Event Activity', href: '/ai/events' },
    ],
  },
  {
    key: 'automations',
    label: 'Automations',
    description: 'Build and manage business automations.',
    href: '/ai/automations',
    icon: Wand2,
    matches: ['/ai/automations', '/ai/workflows', '/ai/templates'],
    children: [
      { label: 'Automation Home', href: '/ai/automations' },
      { label: 'Workflows', href: '/ai/workflows' },
      { label: 'Templates', href: '/ai/templates' },
    ],
  },
  {
    key: 'assistants',
    label: 'Assistants',
    description: 'Copilots and guided helpers for each module.',
    href: '/ai/assistants',
    icon: Bot,
    matches: ['/ai/assistants', '/ai/copilots', '/ai/agents'],
    children: [
      { label: 'Assistant Home', href: '/ai/assistants' },
      { label: 'Copilots', href: '/ai/copilots' },
      { label: 'Agents', href: '/ai/agents' },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    description: 'Analytics, predictions, and audit evidence.',
    href: '/ai/insights',
    icon: ChartColumn,
    matches: ['/ai/insights', '/ai/analytics', '/ai/audit'],
    children: [
      { label: 'Insights Home', href: '/ai/insights' },
      { label: 'Analytics', href: '/ai/analytics' },
      { label: 'Audit', href: '/ai/audit' },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Governance, provider setup, and defaults.',
    href: '/ai/admin',
    icon: Settings2,
    matches: ['/ai/admin', '/ai/models', '/ai/prompts', '/ai/policies', '/ai/integrations', '/ai/settings'],
    children: [
      { label: 'Admin Home', href: '/ai/admin' },
      { label: 'Models', href: '/ai/models' },
      { label: 'Prompts', href: '/ai/prompts' },
      { label: 'Policies', href: '/ai/policies' },
      { label: 'Integrations', href: '/ai/integrations' },
      { label: 'Settings', href: '/ai/settings' },
    ],
  },
];

function getActiveSection(pathname: string): SectionConfig {
  return (
    SECTIONS.find((section) =>
      section.matches.some((match) => pathname === match || pathname.startsWith(`${match}/`))
    ) || SECTIONS[0]
  );
}

export function AIModuleLayout({
  children,
  initialMode,
  aiRoles,
}: {
  children: ReactNode;
  initialMode: AIExperienceMode;
  aiRoles: string[];
}) {
  const pathname = usePathname();
  const activeSection = useMemo(() => getActiveSection(pathname), [pathname]);
  const canUseAdvanced = aiRoles.includes('AI_ADMIN') || aiRoles.includes('AUTOMATION_DESIGNER');
  const [mode, setModeState] = useState<AIExperienceMode>(canUseAdvanced ? initialMode : 'simple');
  const lastPatchSignature = useRef<string>('');

  const patchPreferences = async (patch: Record<string, unknown>) => {
    await fetch('/api/ai/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => null);
  };

  const setMode = (nextMode: AIExperienceMode) => {
    const safeMode = canUseAdvanced ? nextMode : 'simple';
    setModeState(safeMode);
    void patchPreferences({ mode: safeMode });
  };

  useEffect(() => {
    const patch: Record<string, unknown> = {
      lastVisitedSection: activeSection.key,
    };

    if (pathname.startsWith('/ai/inbox')) {
      patch.onboardingChecklist = { reviewApprovalInbox: true };
    }

    const signature = JSON.stringify({ pathname, patch, mode });
    if (lastPatchSignature.current === signature) {
      return;
    }

    lastPatchSignature.current = signature;
    void patchPreferences(patch);
  }, [activeSection.key, mode, pathname]);

  return (
    <AIExperienceProvider value={{ mode, setMode, canUseAdvanced }}>
      <div className="space-y-6 px-1 pb-8 pt-5 md:px-2">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-0">
            <div className="flex flex-col gap-6 border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.45),_transparent_28%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_58%,_#f1f5f9_100%)] px-5 py-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)] xl:items-start">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Unified Hub</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">AI &amp; Automation</h1>
                    {mode === 'simple' ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Guided mode
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        Advanced mode
                      </span>
                    )}
                  </div>
                  <p className="max-w-3xl text-base leading-7 text-slate-600">
                    A task-oriented workspace for approvals, automations, assistants, and governance. The default
                    view keeps technical controls out of the way until they are needed.
                  </p>
                </div>

                <div className="flex flex-wrap items-start justify-start gap-2 xl:justify-end">
                  <Button asChild size="lg" className="min-w-[190px] justify-center rounded-xl px-5 shadow-sm">
                    <Link href="/ai/workflows/new">New Automation</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white/90">
                    <Link href="/ai/agents/new">New Assistant</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white/90">
                    <Link href="/ai/policies">Policy Center</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white/90">
                    <Link href="/ai/inbox">Approvals</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white/90">
                    <Link href="/ai/settings">Run Diagnostics</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {SECTIONS.map((section) => {
                    const isActive = section.key === activeSection.key;
                    const Icon = section.icon;

                    return (
                      <Link
                        key={section.key}
                        href={section.href}
                        className={cn(
                          'group rounded-2xl border p-4 transition-all',
                          isActive
                            ? 'border-sky-200 bg-sky-50/90 shadow-sm shadow-sky-100'
                            : 'border-slate-200 bg-white/92 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                              isActive
                                ? 'border-sky-200 bg-white text-sky-700'
                                : 'border-slate-200 bg-slate-50 text-slate-500 group-hover:text-slate-700'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={cn('text-base font-semibold', isActive ? 'text-sky-950' : 'text-slate-900')}>
                              {section.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{section.description}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Workspace mode</p>
                    <p className="text-sm leading-6 text-slate-600">
                      {canUseAdvanced
                        ? 'Use Guided mode for business users and Advanced mode only when technical setup is required.'
                        : 'Your role uses the guided experience by default.'}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('simple')}
                      className={cn(
                        'rounded-xl px-3 py-3 text-left transition-colors',
                        mode === 'simple' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                      )}
                    >
                      <span className="block text-sm font-semibold">Simple</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">Guided business workflow</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => canUseAdvanced && setMode('advanced')}
                      disabled={!canUseAdvanced}
                      className={cn(
                        'rounded-xl px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                        mode === 'advanced' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                      )}
                    >
                      <span className="block text-sm font-semibold">Advanced</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">Power-user controls</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-200/80 pt-1">
                {activeSection.children.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {children}
      </div>
    </AIExperienceProvider>
  );
}
