import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getLocalAIEngine } from '@/lib/ai/local-engine';
import { getGroqEngine } from '@/lib/ai/groq-engine';
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
    const { conversationId, message, tenantId } = body;

    if (!message || !conversationId || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, conversationId, tenantId' },
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

    // Override tenantId if mismatch (security)
    const userTenantId = (session.user as any).tenantId || tenantId;
    if (tenantId !== userTenantId) {
      console.warn(
        `Tenant mismatch: user=${session.user.id}, userTenant=${userTenantId}, requestTenant=${tenantId}`
      );
    }

    // Build message history for context
    const chatMessages = [
      {
        role: 'system' as const,
        content: `You are a helpful business assistant for ${tenantId}. Help with sales, inventory, customers, and other business operations.`,
      },
      ...conversation.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Try Groq first (recommended, free with API key)
    let completionResponse: string;
    let engineUsed = 'unknown';
    let functionCall = null;
    
      // Check if Groq API key is configured
      const groqApiKey = process.env.GROQ_API_KEY;
      console.log('🔍 Checking Groq configuration:', {
        hasApiKey: !!groqApiKey,
        apiKeyLength: groqApiKey?.length || 0,
        model: process.env.GROQ_MODEL,
        timestamp: new Date().toISOString(),
      });
    
      if (groqApiKey) {
        try {
          const groqEngine = getGroqEngine();
          console.log('🚀 Initializing Groq engine...');
          const initSuccess = await groqEngine.initialize();
          console.log(`📊 Groq initialize result: ${initSuccess}`);
        
          if (initSuccess) {
            const status = groqEngine.getStatus();
            console.log('✅ Groq status:', JSON.stringify(status));
          
            if (status.available) {
              console.log('✅ Using Groq engine for chat completion');
              engineUsed = 'groq';
            
              const groqResponse = await groqEngine.generateCompletion(chatMessages, {
                temperature: 0.7,
                maxTokens: 2000,
              });
            
              completionResponse = groqResponse.response;
              console.log('✅ Groq response received successfully');
            } else {
              console.log('⚠️ Groq engine reported not available:', status.error);
              throw new Error('Groq engine not available');
            }
          } else {
            console.log('⚠️ Groq initialization failed');
            throw new Error('Groq initialization failed');
          }
        } catch (groqError: any) {
          console.error('❌ Groq error:', {
            message: groqError?.message,
            stack: groqError?.stack,
          });
          console.log('ℹ️ Groq failed, falling back to Ollama:', groqError?.message);
          engineUsed = 'ollama-local';
        
          // Fallback to local AI engine
          const engine = getLocalAIEngine();

          // Generate completion with local AI
          const completion = await engine.generateCompletion(chatMessages, {
            model: process.env.OLLAMA_MODEL || 'llama2',
            temperature: 0.7,
            maxTokens: 2000,
            functions: AGENT_FUNCTIONS,
            functionCall: 'auto',
          });

          completionResponse = completion.response;
          functionCall = completion.functionCall || null;
        }
      } else {
        console.log('⚠️ No Groq API key configured, using Ollama fallback');
        engineUsed = 'ollama-local';
      
        // Fallback to local AI engine
        const engine = getLocalAIEngine();

        // Generate completion with local AI
        const completion = await engine.generateCompletion(chatMessages, {
          model: process.env.OLLAMA_MODEL || 'llama2',
          temperature: 0.7,
          maxTokens: 2000,
          functions: AGENT_FUNCTIONS,
          functionCall: 'auto',
        });

        completionResponse = completion.response;
        functionCall = completion.functionCall || null;
      }

    // Check if response contains a function call (for Ollama)
    let functionResult = null;

    if (functionCall) {
      try {
        functionResult = await executeAgentFunction(
          functionCall.name,
          functionCall.arguments,
          userTenantId
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
        tenantId: userTenantId,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

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
      { error: 'Failed to generate completion' },
      { status: 500 }
    );
  }
}
