/**
 * Direct Groq Client Test - bypasses engine wrapper to test raw API connectivity
 */

async function testGroqConnection() {
  const apiKey = process.env.GROQ_API_KEY;
  
  console.log('\n=== Direct Groq API Test ===');
  console.log('API Key present:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);
  
  if (!apiKey) {
    console.error('❌ No GROQ_API_KEY in environment');
    return;
  }

  try {
    // Test 1: List models
    console.log('\n1️⃣  Fetching available models...');
    const modelsResponse = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!modelsResponse.ok) {
      console.error(`❌ Models request failed: ${modelsResponse.status}`);
      const errText = await modelsResponse.text();
      console.error('Response:', errText.substring(0, 200));
      return;
    }

    const modelsData = await modelsResponse.json();
    console.log(`✅ Models available: ${modelsData.data?.length || 0}`);
    const first3 = modelsData.data?.slice(0, 3).map(m => m.id).join(', ');
    console.log('   First 3 models:', first3);

    // Test 2: Simple chat completion
    console.log('\n2️⃣  Testing chat completion...');
    const completionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'What is 2+2?',
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!completionResponse.ok) {
      console.error(`❌ Completion request failed: ${completionResponse.status}`);
      const errText = await completionResponse.text();
      console.error('Response:', errText.substring(0, 200));
      return;
    }

    const completionData = await completionResponse.json();
    console.log(`✅ Chat completion successful`);
    console.log(`   Model used: ${completionData.model}`);
    console.log(`   Response: "${completionData.choices[0].message.content.substring(0, 100)}..."`);
    console.log(`   Tokens: ${completionData.usage.total_tokens}`);

    console.log('\n✅ All Groq API tests passed!\n');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

// Run the test
testGroqConnection().catch(console.error);
