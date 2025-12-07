/**
 * Test script to verify Groq configuration and connectivity
 * Run with: npx ts-node test-groq.ts
 */

async function testGroqConfiguration() {
  console.log('🔍 Testing Groq Configuration\n');

  // 1. Check environment variables
  console.log('1️⃣ Environment Variables:');
  const groqApiKey = process.env.GROQ_API_KEY;
  const groqModel = process.env.GROQ_MODEL;
  
  console.log(`   ✓ GROQ_API_KEY: ${groqApiKey ? '✅ SET' : '❌ MISSING'} (${groqApiKey?.substring(0, 10)}...)`);
  console.log(`   ✓ GROQ_MODEL: ${groqModel || 'DEFAULT (llama-3-70b-versatile)'}\n`);

  if (!groqApiKey) {
    console.error('❌ GROQ_API_KEY is not set in .env file!');
    process.exit(1);
  }

  // 2. Test API connection
  console.log('2️⃣ Testing Groq API Connection:');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Connection successful!`);
      console.log(`   ✓ Available models: ${data.data?.length || 0}`);
      
      if (data.data) {
        console.log(`   ✓ Models:`);
        data.data.forEach((m: any) => {
          console.log(`     - ${m.id}`);
        });
      }
    } else if (response.status === 401) {
      console.error(`   ❌ Invalid API key (401 Unauthorized)`);
      console.error(`   Check your GROQ_API_KEY in .env`);
      process.exit(1);
    } else {
      console.error(`   ❌ API error: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.error(`   Response: ${error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`   ❌ Connection failed: ${error.message}`);
    console.error(`   Make sure you have internet connection`);
    process.exit(1);
  }

  // 3. Test chat completion
  console.log('\n3️⃣ Testing Chat Completion:');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel || 'llama-3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: 'Hello! Can you help me?',
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Chat completion successful!`);
      console.log(`   ✓ Response: ${data.choices?.[0]?.message?.content?.substring(0, 50)}...`);
      console.log(`   ✓ Model: ${data.model}`);
      console.log(`   ✓ Tokens used: ${data.usage?.total_tokens}`);
    } else {
      console.error(`   ❌ Chat API error: ${response.status}`);
      const error = await response.json();
      console.error(`   ${error.error?.message || error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`   ❌ Chat test failed: ${error.message}`);
    process.exit(1);
  }

  console.log('\n✅ All tests passed! Groq is properly configured.\n');
}

testGroqConfiguration().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
