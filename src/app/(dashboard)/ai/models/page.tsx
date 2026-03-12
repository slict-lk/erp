import { AIPageShell } from '@/components/ai/ai-primitives';
import { ModelsManager } from '@/components/ai/models-manager';
import { listModels } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIModelsPage() {
  const { tenantId } = await requireAIAccess('view');
  const models = await listModels(tenantId);

  return (
    <AIPageShell
      title="Models"
      description="Hybrid model registry covering cloud and self-hosted providers with tenant-safe routing."
    >
      <ModelsManager initialModels={models} />
    </AIPageShell>
  );
}
