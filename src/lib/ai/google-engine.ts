/**
 * Google Gemini AI Engine - Provides Google Gemini integration
 * Uses REST API directly for maximum compatibility and control
 */

export interface GeminiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Generate a completion using Google Gemini REST API
 */
export async function generateGeminiCompletion(
  messages: GeminiChatMessage[],
  options: {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<{
  response: string;
  tokens: number;
  model: string;
}> {
  const modelId = options.model || 'gemini-2.5-flash';

  // Separate system instruction from conversation messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // Build the system instruction from all system messages
  const systemInstruction = systemMessages.map((m) => m.content).join('\n');

  // Build the contents array for Gemini
  const contents = conversationMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Ensure the conversation starts with a user message (Gemini requirement)
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({
      role: 'user',
      parts: [{ text: 'Hello' }],
    });
  }

  console.log(`🔮 Calling Google Gemini (${modelId})...`);

  // Build the request body
  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2000,
    },
  };

  // Add system instruction if present
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${options.apiKey}`;

  const fetchResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!fetchResponse.ok) {
    const errorData = await fetchResponse.json().catch(() => ({}));
    const errorMessage =
      errorData?.error?.message || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`;
    throw new Error(
      `[GoogleGenerativeAI Error]: ${errorMessage}`
    );
  }

  const data = await fetchResponse.json();

  // Extract text from response
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text || '')
      .join('') || '';

  // Extract token usage
  const usageMetadata = data.usageMetadata;
  const totalTokens =
    usageMetadata?.totalTokenCount ||
    Math.ceil(
      (messages.reduce((s, m) => s + m.content.length, 0) + text.length) / 4
    );

  console.log(`✅ Gemini response received (${totalTokens} tokens)`);

  return {
    response: text,
    tokens: totalTokens,
    model: modelId,
  };
}
