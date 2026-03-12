import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AIPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 px-1 pb-6 pt-5 md:px-2">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">AI Workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="max-w-3xl text-sm text-slate-600">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AIActionLink({
  href,
  label,
  variant = 'default',
}: {
  href: string;
  label: string;
  variant?: 'default' | 'outline';
}) {
  return (
    <Button asChild variant={variant}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function AIStatGrid({
  items,
}: {
  items: Array<{ label: string; value: string; hint: string; tone?: 'slate' | 'sky' | 'amber' | 'emerald' }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <AIStatCard key={`${item.label}-${index}`} {...item} />
      ))}
    </div>
  );
}

export function AIStatCard({
  label,
  value,
  hint,
  tone = 'slate',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'slate' | 'sky' | 'amber' | 'emerald';
}) {
  const toneMap = {
    slate: 'border-slate-200 bg-white',
    sky: 'border-sky-200 bg-sky-50/70',
    amber: 'border-amber-200 bg-amber-50/80',
    emerald: 'border-emerald-200 bg-emerald-50/80',
  } as const;

  return (
    <Card className={cn('shadow-sm', toneMap[tone])}>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="text-3xl font-semibold text-slate-950">{value}</p>
        <p className="text-sm text-slate-600">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function AISectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600">{description}</CardDescription>
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export function AIFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function AIStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant =
    normalized.includes('fail') || normalized.includes('reject') || normalized.includes('critical')
      ? 'destructive'
      : normalized.includes('pending') || normalized.includes('attention') || normalized.includes('queued')
        ? 'secondary'
        : 'outline';

  return <Badge variant={variant}>{status}</Badge>;
}

export function AIEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function AIMetaList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</dt>
          <dd className="mt-2 text-sm text-slate-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
