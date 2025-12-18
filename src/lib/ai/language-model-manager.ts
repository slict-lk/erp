import { prisma } from '@/lib/prisma';
import { ModelProvider } from '@prisma/client';

export interface LanguageModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  modelId: string;
  temperature: number;
  maxTokens?: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  apiEndpoint?: string;
  apiKey?: string;
  config?: any;
  contextWindow?: number;
}

export interface ModelUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
}

/**
 * Get the default language model for a tenant
 */
export async function getDefaultModel(tenantId: string): Promise<LanguageModelConfig | null> {
  const model = await prisma.languageModel.findFirst({
    where: {
      tenantId,
      isDefault: true,
      isActive: true,
    },
  });

  if (!model) {
    // Fallback to any active model
    const fallback = await prisma.languageModel.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        usageCount: 'desc',
      },
    });

    return fallback ? mapToConfig(fallback) : null;
  }

  return mapToConfig(model);
}

/**
 * Get a specific language model by ID
 */
export async function getModelById(modelId: string): Promise<LanguageModelConfig | null> {
  const model = await prisma.languageModel.findUnique({
    where: { id: modelId },
  });

  return model ? mapToConfig(model) : null;
}

/**
 * Get a language model by provider and modelId
 */
export async function getModelByProviderAndId(
  tenantId: string,
  provider: ModelProvider,
  modelId: string
): Promise<LanguageModelConfig | null> {
  const model = await prisma.languageModel.findFirst({
    where: {
      tenantId,
      provider,
      modelId,
      isActive: true,
    },
  });

  return model ? mapToConfig(model) : null;
}

/**
 * Record model usage
 */
export async function recordModelUsage(
  tenantId: string,
  modelId: string,
  metrics: ModelUsageMetrics,
  options?: {
    conversationId?: string;
    userId?: string;
    operation?: string;
    success?: boolean;
    errorMessage?: string;
    metadata?: any;
  }
): Promise<void> {
  try {
    // Create usage record
    await prisma.modelUsage.create({
      data: {
        tenantId,
        modelId,
        conversationId: options?.conversationId,
        userId: options?.userId,
        operation: options?.operation || 'chat',
        promptTokens: metrics.promptTokens,
        completionTokens: metrics.completionTokens,
        totalTokens: metrics.totalTokens,
        cost: metrics.cost,
        latencyMs: metrics.latencyMs,
        success: options?.success !== false,
        errorMessage: options?.errorMessage,
        metadata: options?.metadata,
      },
    });

    // Update model statistics
    await prisma.languageModel.update({
      where: { id: modelId },
      data: {
        usageCount: { increment: 1 },
        totalTokens: { increment: BigInt(metrics.totalTokens) },
        totalCost: { increment: metrics.cost },
        lastUsedAt: new Date(),
      },
    });

    // Record conversation-model relationship if conversationId provided
    if (options?.conversationId) {
      await prisma.conversationModel.create({
        data: {
          conversationId: options.conversationId,
          modelId,
          tenantId,
          tokensUsed: metrics.totalTokens,
          cost: metrics.cost,
        },
      });
    }
  } catch (error) {
    console.error('Error recording model usage:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}

/**
 * Calculate cost based on provider and token usage
 */
export function calculateCost(
  provider: ModelProvider,
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Pricing per 1M tokens (as of 2024)
  const pricing: Record<string, { prompt: number; completion: number }> = {
    // OpenAI
    'gpt-4': { prompt: 30, completion: 60 },
    'gpt-4-turbo': { prompt: 10, completion: 30 },
    'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
    // Groq (free tier, but setting nominal values)
    'llama-3.1-70b-versatile': { prompt: 0, completion: 0 },
    'mixtral-8x7b-32768': { prompt: 0, completion: 0 },
    // Anthropic
    'claude-3-opus': { prompt: 15, completion: 75 },
    'claude-3-sonnet': { prompt: 3, completion: 15 },
    // Default
    default: { prompt: 0, completion: 0 },
  };

  const rates = pricing[modelId] || pricing.default;
  const promptCost = (promptTokens / 1_000_000) * rates.prompt;
  const completionCost = (completionTokens / 1_000_000) * rates.completion;

  return promptCost + completionCost;
}

/**
 * Get or create a default model for a tenant
 */
export async function ensureDefaultModel(tenantId: string): Promise<LanguageModelConfig> {
  let model = await getDefaultModel(tenantId);

  if (!model) {
    // Create a default Ollama model
    const created = await prisma.languageModel.create({
      data: {
        tenantId,
        name: 'Qwen 2.5 (Default)',
        provider: 'OLLAMA',
        modelId: 'qwen2.5:0.5b',
        description: 'Default local language model',
        capabilities: ['chat', 'completion'],
        contextWindow: 4096,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        apiEndpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        isDefault: true,
        isActive: true,
      },
    });

    model = mapToConfig(created);
  }

  return model;
}

/**
 * Get prompt template by name
 */
export async function getPromptTemplate(
  tenantId: string,
  name: string
): Promise<{ template: string; variables: string[] } | null> {
  const prompt = await prisma.promptTemplate.findUnique({
    where: {
      tenantId_name: {
        tenantId,
        name,
      },
    },
  });

  if (!prompt || !prompt.isActive) {
    return null;
  }

  // Increment usage count
  await prisma.promptTemplate.update({
    where: { id: prompt.id },
    data: { usageCount: { increment: 1 } },
  });

  return {
    template: prompt.template,
    variables: prompt.variables,
  };
}

/**
 * Render a prompt template with variables
 */
export function renderPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }

  return rendered;
}

/**
 * Map database model to config
 */
function mapToConfig(model: any): LanguageModelConfig {
  return {
    id: model.id,
    name: model.name,
    provider: model.provider,
    modelId: model.modelId,
    temperature: model.temperature,
    maxTokens: model.maxTokens,
    topP: model.topP,
    frequencyPenalty: model.frequencyPenalty,
    presencePenalty: model.presencePenalty,
    apiEndpoint: model.apiEndpoint,
    apiKey: model.apiKey,
    config: model.config,
    contextWindow: model.contextWindow,
  };
}
