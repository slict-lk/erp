import { WorkflowComposer } from '@/components/ai/workflow-composer';
import { AIPageShell, AISectionCard } from '@/components/ai/ai-primitives';
import { listPolicyProfiles } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AINewWorkflowPage() {
  const { tenantId } = await requireAIAccess('create');
  const policies = await listPolicyProfiles(tenantId);

  return (
    <AIPageShell
      title="Create Workflow"
      description="Build an approval-aware workflow definition on top of the unified orchestration runtime."
    >
      <AISectionCard
        title="Workflow Composer"
        description="Capture trigger, routing policy, and execution steps. The form publishes directly into the Studio workflow runtime."
      >
        <WorkflowComposer policyProfiles={policies.map((policy) => ({ id: policy.id, name: policy.name }))} />
      </AISectionCard>
    </AIPageShell>
  );
}

