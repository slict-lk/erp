import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getLocalAIEngine } from '@/lib/ai/local-engine';
import { getGroqEngine } from '@/lib/ai/groq-engine';
import { recordModelUsage } from '@/lib/ai/control-plane';
import { AGENT_FUNCTIONS, executeAgentFunction } from '@/lib/ai/chat-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/chat/complete
 * Send a message to the AI engine (Groq first, fallback to local Ollama)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, message } = body;
    const sessionTenantId = (session.user as any).tenantId as string | undefined;

    if (!sessionTenantId) {
      return NextResponse.json(
        { error: 'Forbidden: no tenant in session' },
        { status: 403 }
      );
    }

    const tenantId = sessionTenantId;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, conversationId' },
        { status: 400 }
      );
    }

    // Get conversation to verify ownership and get context
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: -10, // Last 10 messages for context
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (conversation.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const configuredModel = await prisma.languageModel.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        provider: true,
        modelId: true,
      },
    });

    // Build message history for context
    const chatMessages = [
      {
        role: 'system' as const,
        content: `You are a helpful business assistant for ${tenantId}. Help with sales, inventory, customers, and other business operations.`,
      },
      ...conversation.messages.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Try Groq first (recommended, free with API key)
    let completionResponse: string = '';
    let engineUsed = 'unknown';
    let functionCall = null;
    let usedProvider: string | null = null;
    let usedModelId: string | null = null;
    let totalTokens = 0;

    // Check if Groq API key is configured
    const groqApiKey = process.env.GROQ_API_KEY;
    const preferredProvider = configuredModel?.provider || null;
    const shouldUseGroq = preferredProvider ? preferredProvider === 'GROQ' : Boolean(groqApiKey);

    if (preferredProvider === 'GROQ' && !groqApiKey) {
      console.warn(`Configured provider is GROQ but GROQ_API_KEY is missing. Tenant: ${tenantId}, model: ${configuredModel?.id}. Falling back to Ollama.`);
    }

    console.log('🔍 Checking Groq configuration:', {
      hasApiKey: !!groqApiKey,
      apiKeyLength: groqApiKey?.length || 0,
      model: process.env.GROQ_MODEL,
      timestamp: new Date().toISOString(),
    });

    if (shouldUseGroq && groqApiKey) {
      try {
        console.log('🔒 Groq API Key found (length: ' + groqApiKey.length + ')');
        const groqEngine = getGroqEngine();
        console.log('🚀 Initializing Groq engine...');
        // Relaxed initialization: try to use it even if ping fails, as it might just be a timeout
        await groqEngine.initialize();

        const status = groqEngine.getStatus();
        console.log('✅ Groq status:', JSON.stringify(status));

        // Force availability if we have a key, even if strict check failed
        if (!status.available) {
          console.warn('⚠️ Groq reported unavailable, but key is present. Attempting to force execution.');
        }

        console.log('✅ Using Groq engine for chat completion');
        engineUsed = 'groq';

        const groqResponse = await groqEngine.generateCompletion(chatMessages, {
          model: preferredProvider === 'GROQ' ? configuredModel?.modelId : undefined,
          temperature: 0.7,
          maxTokens: 2000,
        });

        completionResponse = groqResponse.response;
        usedProvider = 'GROQ';
        usedModelId = groqResponse.model;
        totalTokens = groqResponse.tokens || 0;
        console.log('✅ Groq response received successfully');
      } catch (error: any) {
        console.error('❌ Groq Execution Failed, falling back to Ollama:', error);
      }
    }

    if (!usedProvider) {
      console.log('⚠️ Using Ollama fallback');
      engineUsed = 'ollama-local';

      // Fallback to local AI engine
      const engine = getLocalAIEngine();

      // Generate completion with local AI
      const completion = await engine.generateCompletion(chatMessages, {
        model:
          preferredProvider === 'OLLAMA'
            ? configuredModel?.modelId
            : process.env.OLLAMA_MODEL || 'llama2',
        temperature: 0.7,
        maxTokens: 2000,
        functions: AGENT_FUNCTIONS,
        functionCall: 'auto',
      });

      completionResponse = completion.response;
      functionCall = completion.functionCall || null;
      usedProvider = 'OLLAMA';
      usedModelId =
        preferredProvider === 'OLLAMA'
          ? configuredModel?.modelId || process.env.OLLAMA_MODEL || 'llama2'
          : process.env.OLLAMA_MODEL || 'llama2';

      // Estimate tokens for Ollama (rough approximation: ~4 chars per token)
      const totalChars = chatMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) + (completionResponse?.length || 0);
      totalTokens = Math.ceil(totalChars / 4);
    }

    // Check if response contains a function call (for Ollama)
    let functionResult = null;

    if (functionCall) {
      try {
        functionResult = await executeAgentFunction(
          functionCall.name,
          functionCall.arguments,
          tenantId
        );
      } catch (error) {
        console.error('Function execution error:', error);
        functionResult = { error: 'Failed to execute function' };
      }
    }

    // Save assistant message to database
    const assistantMessage = await prisma.conversationMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: completionResponse,
        functionCalls: functionCall ? [functionCall] : undefined,
        tenantId,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    try {
      await recordModelUsage({
        tenantId,
        modelId: configuredModel?.id || null,
        provider: usedProvider,
        providerModelId: usedModelId,
        conversationId,
        userId: session.user.id,
        operation: 'chat_completion',
        totalTokens,
        success: true,
        metadata: {
          engine: engineUsed,
        },
      });
    } catch (usageError) {
      console.error('Failed to record model usage:', usageError);
    }

    return NextResponse.json({
      message: assistantMessage,
      functionCall,
      functionResult,
      engineStatus: {
        engine: engineUsed,
        available: true,
      },
    });
  } catch (error: any) {
    console.error('Error in chat completion:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate completion', 
        details: error.message || error.toString() 
      },
      { status: 500 }
    );
  }
}
