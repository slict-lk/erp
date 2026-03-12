import { AIPageShell } from '@/components/ai/ai-primitives';
import { PoliciesManager } from '@/components/ai/policies-manager';
import { listPolicyProfiles } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIPoliciesPage() {
  const { tenantId } = await requireAIAccess('view');
  const policies = await listPolicyProfiles(tenantId);

  return (
    <AIPageShell
      title="Policies"
      description="Risk profiles and approval thresholds that govern AI execution across modules."
    >
      <PoliciesManager initialPolicies={policies} />
    </AIPageShell>
  );
}
