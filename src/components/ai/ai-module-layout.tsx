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
      <div className="space-y-8 px-1 pb-12 pt-6 md:px-4">
        <Card className="overflow-hidden border-slate-200/60 shadow-xl shadow-slate-200/20 bg-white/70 backdrop-blur-md">
          <CardContent className="space-y-6 p-0">
            <div className="relative flex flex-col gap-10 border-b border-slate-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.35),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(224,231,255,0.3),_transparent_40%),linear-gradient(135deg,_#fcfdff_0%,_#ffffff_50%,_#f8faff_100%)] px-8 py-10">
              <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-sky-50/20 to-transparent pointer-events-none" />
              
              <div className="relative grid gap-10 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 shadow-sm shadow-sky-200" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-600/90">Central Intelligence</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
                      AI &amp; Automation
                    </h1>
                    <div className="animate-in fade-in zoom-in-95 duration-500 delay-300">
                      {mode === 'simple' ? (
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Guided
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Advanced
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="max-w-3xl text-lg leading-relaxed text-slate-500/90 font-medium">
                    A task-oriented workspace for approvals, automations, assistants, and governance. 
                    The default view keeps technical controls out of the way until they are needed.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:justify-end animate-in fade-in slide-in-from-right-8 duration-700">
                  <Button asChild size="lg" className="h-12 min-w-[200px] rounded-xl bg-slate-950 text-white shadow-lg hover:shadow-slate-300 transition-all hover:translate-y-[-2px]">
                    <Link href="/ai/workflows/new">New Automation</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-xl border-slate-200 bg-white/90 shadow-sm hover:shadow-md transition-all">
                    <Link href="/ai/agents/new">New Assistant</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-xl border-slate-200 bg-white/90 shadow-sm hover:shadow-md transition-all">
                    <Link href="/ai/policies">Policy Center</Link>
                  </Button>
                </div>
              </div>

              <div className="relative grid gap-8 xl:grid-cols-[1fr_320px] xl:items-start">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
