import { AIPageShell } from '@/components/ai/ai-primitives';
import { PromptsManager } from '@/components/ai/prompts-manager';
import { listModels, listPrompts } from '@/lib/ai/control-plane';
import { requireAIAccess } from '@/lib/ai/governance';

export const dynamic = 'force-dynamic';

export default async function AIPromptsPage() {
  const { tenantId } = await requireAIAccess('view');
  const [prompts, models] = await Promise.all([listPrompts(tenantId), listModels(tenantId)]);

  return (
    <AIPageShell
      title="Prompts"
      description="Prompt registry, usage posture, and template variables across copilots and agents."
    >
      <PromptsManager initialPrompts={prompts} models={models} />
    </AIPageShell>
  );
}
