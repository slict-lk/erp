import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  href: string;
  help: string;
};

export function AIOnboardingChecklist({
  items,
  title = 'Getting Started',
  description = 'Use this checklist to make the AI workspace usable for business teams.',
}: {
  items: ChecklistItem[];
  title?: string;
  description?: string;
}) {
  const completeCount = items.filter((item) => item.done).length;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="text-lg text-slate-950">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {completeCount} of {items.length} setup steps completed
        </div>
        {items.map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 text-slate-300" />
              )}
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.help}</p>
              </div>
            </div>
            <Button asChild variant={item.done ? 'outline' : 'default'} size="sm">
              <Link href={item.href}>{item.done ? 'Review' : 'Open'}</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
