import { AIActionLink, AIEmptyState, AIPageShell, AISectionCard, AIStatGrid, AIStatusBadge } from '@/components/ai/ai-primitives';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCommandCenterData } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIOverviewPage() {
  const { tenantId } = await requireAIAccess('view');
  const data = await getCommandCenterData(tenantId);
  const items = [
    {
      label: 'Active Workflows',
      value: String(data.summary.activeWorkflows),
      hint: 'Live orchestration definitions across tenant modules.',
      tone: 'sky' as const,
    },
    {
      label: 'Pending Approvals',
      value: String(data.summary.pendingApprovals),
      hint: 'High-impact actions waiting for review.',
      tone: 'amber' as const,
    },
    {
      label: 'Failed Runs',
      value: String(data.summary.failedRuns),
      hint: 'Visible execution failures requiring operator attention.',
      tone: 'slate' as const,
    },
    {
      label: 'Active Agents',
      value: String(data.summary.activeAgents),
      hint: 'Configured copilots and specialist agents.',
      tone: 'emerald' as const,
    },
  ];

  return (
    <AIPageShell
      title="Command Center"
      description="Monitor workflow health, approvals, AI coverage, and cross-module automation posture from a single operator workspace."
      actions={
        <>
          <AIActionLink href="/ai/workflows/new" label="Create Workflow" />
          <AIActionLink href="/ai/inbox" label="Open Approvals" variant="outline" />
          <AIActionLink href="/ai/analytics" label="View Failures" variant="outline" />
          <Button variant="outline" disabled>{/* TODO: implement exportReport handler */}Export Report</Button>
        </>
      }
    >
      <AIStatGrid items={items} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AISectionCard title="Risk Alerts" description="Unread AI insights and operational exceptions.">
          {data.alerts.length === 0 ? (
            <AIEmptyState
              title="No active alerts"
              description="AIInsight records have not produced any current exceptions for this tenant."
            />
          ) : (
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{alert.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                    </div>
                    <AIStatusBadge status={alert.severity} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(alert.createdAt))}</p>
                </div>
              ))}
            </div>
          )}
        </AISectionCard>

        <AISectionCard title="Module Heatmap" description="Coverage and current execution posture by business module.">
          <div className="space-y-3">
            {data.moduleHeatmap.map((row) => (
              <div key={row.module} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize text-slate-950">{row.module}</p>
                    <p className="text-sm text-slate-600">
                      {row.automationCount} automations, {row.approvalBacklog} approvals in queue
                    </p>
                  </div>
                  <AIStatusBadge status={row.health} />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Copilot {row.copilotEnabled ? 'enabled' : 'not enabled'}
                </p>
              </div>
            ))}
          </div>
        </AISectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AISectionCard title="Pending Approvals" description="Work items awaiting approver intervention.">
          {data.pendingApprovals.length === 0 ? (
            <AIEmptyState
              title="Approval queue is clear"
              description="No approval-gated actions are waiting in the tenant queue."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.pendingApprovals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{approval.title}</p>
                        <p className="text-sm text-slate-600">{approval.summary}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{approval.module}</TableCell>
                    <TableCell>{approval.riskScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AISectionCard>

        <AISectionCard title="Failed Runs" description="Recent failed executions from the workflow runtime.">
          {data.failedRuns.length === 0 ? (
            <AIEmptyState
              title="No failed runs"
              description="Recent workflow executions have not produced any recorded failures."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.failedRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{run.workflowName}</p>
                        <p className="text-sm text-slate-600">{run.error}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AIStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell>{new Date(run.startedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AISectionCard>
      </div>
    </AIPageShell>
  );
}
