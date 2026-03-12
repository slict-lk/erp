import { ApprovalQueue } from '@/components/ai/approval-queue';
import { AIActionLink, AIPageShell, AISectionCard } from '@/components/ai/ai-primitives';
import { listApprovalQueue } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIInboxPage() {
  const { tenantId } = await requireAIAccess('approve');
  const approvals = await listApprovalQueue(tenantId);

  return (
    <AIPageShell
      title="Approval Inbox"
      description="Review high-impact AI actions before execution. Queue items are tenant-scoped and fully auditable."
      actions={<AIActionLink href="/ai" label="Back to Command Center" variant="outline" />}
    >
      <AISectionCard
        title="Pending Decisions"
        description="Approve, reject, request changes, or escalate risk-sensitive actions."
      >
        <ApprovalQueue approvals={approvals} />
      </AISectionCard>
    </AIPageShell>
  );
}

