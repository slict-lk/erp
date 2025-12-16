import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { getLocalAIEngine } from '@/lib/ai/local-engine';
import { getGroqEngine } from '@/lib/ai/groq-engine';
import { AGENT_FUNCTIONS, executeAgentFunction, processUserMessage } from '@/lib/ai/chat-agent';

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

    // Build message history for context (excluding the current new message)
    const history = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
      content: msg.content,
      // Include function calls in history if available
      ...(msg.functionCalls ? { function_call: (msg.functionCalls as any)[0] } : {})
    }));

    // Process the message with AI Agent (handles Groq/Ollama and function calling loop)
    const aiResponse = await processUserMessage(message, history, userTenantId);

    // Save assistant message to database
    const assistantMessage = await prisma.conversationMessage.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiResponse.response,
        functionCalls: aiResponse.functionCalls,
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
      functionCall: aiResponse.functionCalls ? aiResponse.functionCalls[0] : null,
      engineStatus: {
        engine: 'auto',
        available: true,
      },
    });
  } catch (error: any) {
    console.error('Error in chat completion:', error);
    return NextResponse.json(
      { error: `Failed to generate completion: ${error.message}` },
      { status: 500 }
    );
  }
}
