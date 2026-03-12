import { AIPageShell } from '@/components/ai/ai-primitives';
import { IntegrationsManager } from '@/components/ai/integrations-manager';
import { listIntegrationConfigs } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIIntegrationsPage() {
  const { tenantId } = await requireAIAccess('view');
  const integrations = await listIntegrationConfigs(tenantId);

  return (
    <AIPageShell
      title="Integrations"
      description="Provider connectors, webhook posture, and execution boundaries for the AI module."
    >
      <IntegrationsManager initialIntegrations={integrations} />
    </AIPageShell>
  );
}
