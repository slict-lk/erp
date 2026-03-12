import { notFound } from 'next/navigation';
import { AIEmptyState, AIPageShell, AISectionCard, AIStatusBadge, AIMetaList } from '@/components/ai/ai-primitives';
import { WorkflowDetailActions } from '@/components/ai/workflow-detail-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getWorkflowDetail, toWorkflowDefinition } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIWorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { tenantId } = await requireAIAccess('view');
  const { id } = await params;
  const detail = await getWorkflowDetail(tenantId, id);

  if (!detail) {
    notFound();
  }

  const definition = toWorkflowDefinition(detail.workflow);

  return (
    <AIPageShell
      title={definition.name}
      description="Inspect versioned workflow configuration, policy routing, and execution history."
    >
      <AIMetaList
        items={[
          { label: 'Trigger', value: definition.trigger.event },
          { label: 'Policy Profile', value: definition.policyProfileId || 'Unassigned' },
          { label: 'Enabled', value: definition.enabled ? 'Yes' : 'No' },
          { label: 'Steps', value: String(definition.steps.length) },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AISectionCard title="Definition" description="Current trigger and step composition.">
          <div className="space-y-3">
            {definition.steps.map((step, index) => (
              <div key={step.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">Step {index + 1}</p>
                    <p className="text-sm text-slate-600">{String(step.config.label || step.kind)}</p>
                  </div>
                  <AIStatusBadge status={step.kind} />
                </div>
              </div>
            ))}
          </div>
        </AISectionCard>

        <AISectionCard title="Operator Actions" description="Control execution state, clone the workflow, or run a live test from this detail view.">
          <WorkflowDetailActions
            workflowId={definition.id}
            workflowName={definition.name}
            enabled={definition.enabled}
            versions={detail.versions}
          />
        </AISectionCard>
      </div>

      <AISectionCard title="Linked Policies" description="Current routing context from trigger configuration.">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="font-medium text-slate-900">{definition.policyProfileId || 'Unassigned'}</p>
          <p className="mt-1 text-sm text-slate-600">
            Trigger event <span className="font-medium text-slate-900">{definition.trigger.event}</span> will be checked against the configured policy profile before executing sensitive steps.
          </p>
        </div>
      </AISectionCard>

      <AISectionCard title="Execution History" description="Recent runs from the workflow engine.">
        {detail.executions.length === 0 ? (
          <AIEmptyState
            title="No executions recorded"
            description="This workflow has not run yet for the current tenant."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.executions.map((execution: any) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <AIStatusBadge status={execution.status} />
                  </TableCell>
                  <TableCell>{new Date(execution.startedAt).toLocaleString()}</TableCell>
                  <TableCell>{execution.completedAt ? new Date(execution.completedAt).toLocaleString() : 'Running'}</TableCell>
                  <TableCell>{execution.error || 'None'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AISectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <AISectionCard title="Version Timeline" description="Saved workflow snapshots available for rollback.">
          {detail.versions.length === 0 ? (
            <AIEmptyState
              title="No saved versions"
              description="New workflow versions will appear here after lifecycle actions."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.versions.map((version: any) => (
                  <TableRow key={version.id}>
                    <TableCell>{`v${version.version}`}</TableCell>
                    <TableCell>{version.reason}</TableCell>
                    <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{version.createdBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AISectionCard>

        <AISectionCard title="Durable Queue" description="Queued retries and dead-letter records for this workflow.">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Queued / Retrying</p>
              {detail.queuedRuns.length === 0 ? (
                <AIEmptyState
                  title="Queue empty"
                  description="No queued or retrying executions are waiting for this workflow."
                />
              ) : (
                <div className="space-y-2">
                  {detail.queuedRuns.map((item: any) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{item.status}</p>
                          <p className="text-sm text-slate-600">
                            Scheduled for {new Date(item.scheduledFor).toLocaleString()} • attempts {item.attemptCount}/{item.maxAttempts}
                          </p>
                        </div>
                        <AIStatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-900">Dead Letter</p>
              {detail.deadLetters.length === 0 ? (
                <AIEmptyState
                  title="No dead-letter items"
                  description="Failed executions beyond retry limits will surface here."
                />
              ) : (
                <div className="space-y-2">
                  {detail.deadLetters.map((item: any) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-900">{item.lastError || 'Execution failed'}</p>
                          <p className="text-sm text-slate-600">
                            {item.failureHistory?.length || 0} failure(s) recorded
                          </p>
                        </div>
                        <AIStatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AISectionCard>
      </div>
    </AIPageShell>
  );
}
