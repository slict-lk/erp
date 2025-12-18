import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLanguageModels() {
  console.log('🌱 Seeding language models...');

  // Get the first tenant for seeding
  const tenant = await prisma.tenant.findFirst();

  if (!tenant) {
    console.log('⚠️  No tenant found. Please create a tenant first.');
    return;
  }

  const tenantId = tenant.id;
  console.log(`📦 Seeding for tenant: ${tenant.name} (${tenantId})`);

  // Create default language models
  // Get API keys from environment
  const groqApiKey = process.env.GROQ_API_KEY || '';

  const models = [
    {
      tenantId,
      name: 'Qwen 2.5 0.5B (Local)',
      provider: 'OLLAMA' as const,
      modelId: 'qwen2.5:0.5b',
      description: 'Fast and efficient local model for general tasks',
      capabilities: ['chat', 'completion'],
      contextWindow: 4096,
      maxTokens: 2048,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      apiEndpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      isDefault: true,
      isActive: true,
    },
    {
      tenantId,
      name: 'Llama 3.1 70B (Groq)',
      provider: 'GROQ' as const,
      modelId: 'llama-3.1-70b-versatile',
      description: 'Powerful model with excellent reasoning capabilities',
      capabilities: ['chat', 'completion', 'function_calling'],
      contextWindow: 8192,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      apiEndpoint: 'https://api.groq.com/openai/v1',
      apiKey: groqApiKey, // Use API key from .env
      isDefault: false,
      isActive: true,
    },
    {
      tenantId,
      name: 'Mixtral 8x7B (Groq)',
      provider: 'GROQ' as const,
      modelId: 'mixtral-8x7b-32768',
      description: 'Large context window for complex tasks',
      capabilities: ['chat', 'completion', 'function_calling'],
      contextWindow: 32768,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      apiEndpoint: 'https://api.groq.com/openai/v1',
      apiKey: groqApiKey, // Use API key from .env
      isDefault: false,
      isActive: true,
    },
  ];

  for (const model of models) {
    const existing = await prisma.languageModel.findFirst({
      where: {
        tenantId: model.tenantId,
        modelId: model.modelId,
        provider: model.provider,
      },
    });

    if (existing) {
      console.log(`  ✓ Model already exists: ${model.name}`);
      continue;
    }

    await prisma.languageModel.create({ data: model });
    console.log(`  ✓ Created model: ${model.name}`);
  }

  // Create default prompt templates
  const prompts = [
    {
      tenantId,
      name: 'Sales Summary',
      description: 'Generate a comprehensive sales summary',
      category: 'SALES',
      template: `You are a sales analyst. Generate a comprehensive sales summary for {{period}}.

Include:
- Total revenue
- Number of transactions
- Top products/services
- Growth trends
- Key insights

Data: {{data}}`,
      variables: ['period', 'data'],
      isSystem: true,
      isActive: true,
    },
    {
      tenantId,
      name: 'Customer Service Response',
      description: 'Generate a professional customer service response',
      category: 'CUSTOMER_SERVICE',
      template: `You are a helpful customer service representative. Respond to the following customer inquiry professionally and empathetically.

Customer Name: {{customerName}}
Inquiry: {{inquiry}}

Provide a clear, helpful, and friendly response.`,
      variables: ['customerName', 'inquiry'],
      isSystem: true,
      isActive: true,
    },
    {
      tenantId,
      name: 'Data Analysis',
      description: 'Analyze business data and provide insights',
      category: 'ANALYTICS',
      template: `You are a data analyst. Analyze the following business data and provide actionable insights.

Data Type: {{dataType}}
Data: {{data}}

Provide:
1. Key findings
2. Trends and patterns
3. Recommendations
4. Potential risks or opportunities`,
      variables: ['dataType', 'data'],
      isSystem: true,
      isActive: true,
    },
    {
      tenantId,
      name: 'Report Generation',
      description: 'Generate a formatted business report',
      category: 'REPORTING',
      template: `Generate a professional {{reportType}} report.

Title: {{title}}
Period: {{period}}
Data: {{data}}

Format the report with:
- Executive Summary
- Detailed Analysis
- Charts/Tables (describe what should be shown)
- Conclusions and Recommendations`,
      variables: ['reportType', 'title', 'period', 'data'],
      isSystem: true,
      isActive: true,
    },
    {
      tenantId,
      name: 'Email Draft',
      description: 'Draft a professional business email',
      category: 'GENERAL',
      template: `Draft a professional email with the following details:

To: {{recipient}}
Subject: {{subject}}
Purpose: {{purpose}}
Key Points: {{keyPoints}}

Write a clear, concise, and professional email.`,
      variables: ['recipient', 'subject', 'purpose', 'keyPoints'],
      isSystem: true,
      isActive: true,
    },
  ];

  for (const prompt of prompts) {
    const existing = await prisma.promptTemplate.findFirst({
      where: {
        tenantId: prompt.tenantId,
        name: prompt.name,
      },
    });

    if (existing) {
      console.log(`  ✓ Prompt template already exists: ${prompt.name}`);
      continue;
    }

    await prisma.promptTemplate.create({ data: prompt });
    console.log(`  ✓ Created prompt template: ${prompt.name}`);
  }

  console.log('✅ Language models and prompts seeded successfully!');
}

seedLanguageModels()
  .catch((e) => {
    console.error('❌ Error seeding language models:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
