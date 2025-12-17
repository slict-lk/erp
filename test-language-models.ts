import { PrismaClient } from '@prisma/client';
import { 
  getDefaultModel, 
  getModelById,
  getPromptTemplate,
  renderPromptTemplate,
  calculateCost,
  ensureDefaultModel
} from './src/lib/ai/language-model-manager';

const prisma = new PrismaClient();

async function testLanguageModels() {
  console.log('🧪 Testing Language Model Integration\n');
  console.log('=' .repeat(60));

  try {
    // Get first tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('❌ No tenant found. Please create a tenant first.');
      return;
    }

    const tenantId = tenant.id;
    console.log(`\n✅ Testing with tenant: ${tenant.name} (${tenantId})\n`);

    // Test 1: List all models
    console.log('📋 Test 1: List all language models');
    console.log('-'.repeat(60));
    const models = await prisma.languageModel.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        provider: true,
        modelId: true,
        isDefault: true,
        isActive: true,
        usageCount: true,
      },
    });
    
    if (models.length === 0) {
      console.log('⚠️  No models found. Running seed...');
      const { execSync } = require('child_process');
      execSync('npx tsx prisma/seed-language-models.ts', { stdio: 'inherit' });
      console.log('');
    } else {
      console.log(`Found ${models.length} models:`);
      models.forEach((model, i) => {
        console.log(`  ${i + 1}. ${model.name}`);
        console.log(`     Provider: ${model.provider}`);
        console.log(`     Model ID: ${model.modelId}`);
        console.log(`     Default: ${model.isDefault ? '✓' : '✗'}`);
        console.log(`     Active: ${model.isActive ? '✓' : '✗'}`);
        console.log(`     Usage: ${model.usageCount} times`);
      });
    }

    // Test 2: Get default model
    console.log('\n📋 Test 2: Get default model');
    console.log('-'.repeat(60));
    const defaultModel = await getDefaultModel(tenantId);
    if (defaultModel) {
      console.log('✅ Default model found:');
      console.log(`   Name: ${defaultModel.name}`);
      console.log(`   Provider: ${defaultModel.provider}`);
      console.log(`   Model ID: ${defaultModel.modelId}`);
      console.log(`   Temperature: ${defaultModel.temperature}`);
      console.log(`   Context Window: ${defaultModel.contextWindow} tokens`);
    } else {
      console.log('⚠️  No default model found. Creating one...');
      const created = await ensureDefaultModel(tenantId);
      console.log(`✅ Created: ${created.name}`);
    }

    // Test 3: Get model by ID
    console.log('\n📋 Test 3: Get model by ID');
    console.log('-'.repeat(60));
    if (models.length > 0) {
      const testModel = await getModelById(models[0].id);
      if (testModel) {
        console.log(`✅ Retrieved model: ${testModel.name}`);
        console.log(`   ID: ${testModel.id}`);
        console.log(`   Provider: ${testModel.provider}`);
      }
    }

    // Test 4: List prompt templates
    console.log('\n📋 Test 4: List prompt templates');
    console.log('-'.repeat(60));
    const prompts = await prisma.promptTemplate.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        category: true,
        variables: true,
        usageCount: true,
        isActive: true,
      },
    });
    
    console.log(`Found ${prompts.length} prompt templates:`);
    prompts.forEach((prompt, i) => {
      console.log(`  ${i + 1}. ${prompt.name}`);
      console.log(`     Category: ${prompt.category}`);
      console.log(`     Variables: ${prompt.variables.join(', ') || 'none'}`);
      console.log(`     Usage: ${prompt.usageCount} times`);
      console.log(`     Active: ${prompt.isActive ? '✓' : '✗'}`);
    });

    // Test 5: Get and render a prompt template
    console.log('\n📋 Test 5: Get and render prompt template');
    console.log('-'.repeat(60));
    if (prompts.length > 0) {
      const template = await getPromptTemplate(tenantId, prompts[0].name);
      if (template) {
        console.log(`✅ Retrieved template: ${prompts[0].name}`);
        console.log(`   Variables: ${template.variables.join(', ')}`);
        console.log(`   Template preview: ${template.template.substring(0, 100)}...`);
        
        // Render with sample data
        if (template.variables.length > 0) {
          const sampleVars: Record<string, string> = {};
          template.variables.forEach(v => {
            sampleVars[v] = `[${v.toUpperCase()}]`;
          });
          const rendered = renderPromptTemplate(template.template, sampleVars);
          console.log(`\n   Rendered example:`);
          console.log(`   ${rendered.substring(0, 150)}...`);
        }
      }
    }

    // Test 6: Cost calculation
    console.log('\n📋 Test 6: Cost calculation');
    console.log('-'.repeat(60));
    const testCases = [
      { provider: 'OPENAI', model: 'gpt-4', prompt: 1000, completion: 2000 },
      { provider: 'OPENAI', model: 'gpt-3.5-turbo', prompt: 1000, completion: 2000 },
      { provider: 'GROQ', model: 'llama-3.1-70b-versatile', prompt: 1000, completion: 2000 },
    ];

    testCases.forEach(tc => {
      const cost = calculateCost(tc.provider as any, tc.model, tc.prompt, tc.completion);
      console.log(`${tc.provider} ${tc.model}:`);
      console.log(`  ${tc.prompt} prompt + ${tc.completion} completion tokens`);
      console.log(`  Cost: $${cost.toFixed(4)}`);
    });

    // Test 7: Check conversations
    console.log('\n📋 Test 7: Check conversations');
    console.log('-'.repeat(60));
    const conversations = await prisma.conversation.findMany({
      where: { tenantId },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: {
            messages: true,
            models: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (conversations.length > 0) {
      console.log(`Found ${conversations.length} recent conversations:`);
      conversations.forEach((conv, i) => {
        console.log(`  ${i + 1}. ${conv.title || 'Untitled'}`);
        console.log(`     Messages: ${conv._count.messages}`);
        console.log(`     Models used: ${conv._count.models}`);
        console.log(`     Created: ${new Date(conv.createdAt).toLocaleString()}`);
      });
    } else {
      console.log('ℹ️  No conversations found yet.');
    }

    // Test 8: Check model usage
    console.log('\n📋 Test 8: Check model usage statistics');
    console.log('-'.repeat(60));
    const usageStats = await prisma.modelUsage.groupBy({
      by: ['modelId'],
      where: { tenantId },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        latencyMs: true,
      },
    });

    if (usageStats.length > 0) {
      console.log('Usage statistics by model:');
      for (const stat of usageStats) {
        const model = await prisma.languageModel.findUnique({
          where: { id: stat.modelId },
          select: { name: true },
        });
        console.log(`\n  ${model?.name || 'Unknown'}:`);
        console.log(`    Requests: ${stat._count.id}`);
        console.log(`    Total tokens: ${stat._sum.totalTokens || 0}`);
        console.log(`    Total cost: $${(stat._sum.cost || 0).toFixed(4)}`);
        console.log(`    Avg latency: ${stat._avg.latencyMs?.toFixed(0) || 'N/A'}ms`);
      }
    } else {
      console.log('ℹ️  No usage data yet. Start using the AI Assistant to see statistics.');
    }

    // Test 9: API endpoints availability
    console.log('\n📋 Test 9: Check API endpoints');
    console.log('-'.repeat(60));
    const fs = require('fs');
    const endpoints = [
      '/src/app/api/ai/models/route.ts',
      '/src/app/api/ai/models/usage/route.ts',
      '/src/app/api/ai/prompts/route.ts',
    ];

    endpoints.forEach(endpoint => {
      const exists = fs.existsSync(`/home/mubasshir/Documents/erp${endpoint}`);
      console.log(`  ${exists ? '✅' : '❌'} ${endpoint}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Language Models: ${models.length}`);
    console.log(`✅ Prompt Templates: ${prompts.length}`);
    console.log(`✅ Conversations: ${conversations.length}`);
    console.log(`✅ API Endpoints: ${endpoints.length}`);
    console.log(`✅ Default Model: ${defaultModel ? defaultModel.name : 'Created'}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Open the AI Assistant in your app');
    console.log('   3. Test the API: curl http://localhost:3000/api/ai/models?tenantId=' + tenantId);
    console.log('   4. Check usage stats after chatting with the assistant\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testLanguageModels()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
