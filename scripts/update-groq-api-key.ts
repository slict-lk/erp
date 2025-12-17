import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateGroqApiKey() {
  console.log('🔑 Updating Groq API key for models...\n');

  // Get API key from environment
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    console.log('⚠️  GROQ_API_KEY not found in environment variables');
    console.log('   Please set GROQ_API_KEY in your .env file');
    return;
  }

  console.log(`✓ Found GROQ_API_KEY: ${groqApiKey.substring(0, 10)}...`);

  // Update all Groq models
  const result = await prisma.languageModel.updateMany({
    where: {
      provider: 'GROQ',
    },
    data: {
      apiKey: groqApiKey,
    },
  });

  console.log(`\n✅ Updated ${result.count} Groq model(s) with API key`);

  // List updated models
  const models = await prisma.languageModel.findMany({
    where: {
      provider: 'GROQ',
    },
    select: {
      name: true,
      modelId: true,
      apiKey: true,
      isActive: true,
    },
  });

  console.log('\nUpdated models:');
  models.forEach((model) => {
    const keyPreview = model.apiKey 
      ? `${model.apiKey.substring(0, 10)}...` 
      : 'No key';
    console.log(`  ✓ ${model.name}`);
    console.log(`    Model ID: ${model.modelId}`);
    console.log(`    API Key: ${keyPreview}`);
    console.log(`    Active: ${model.isActive ? '✓' : '✗'}`);
  });

  await prisma.$disconnect();
}

updateGroqApiKey().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
