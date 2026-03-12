import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { getTenantAIConfig, logControlPlaneEvent } from '@/lib/ai/control-plane';
import { processUserMessage } from '@/lib/ai/chat-agent';

export const dynamic = 'force-dynamic';

const MODULE_TITLES: Record<string, string> = {
  crm: 'CRM',
  accounting: 'Accounting',
  spareparts: 'Spare Parts',
  'real-estate': 'Real Estate',
  restaurant: 'Restaurant',
  'vehicle-export': 'Vehicle Export',
  studio: 'Studio',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(session.user as any).tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId as string;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const module = String(body.module || '');
    const message = String(body.message || '').trim();
    const context = body.context && typeof body.context === 'object' && !Array.isArray(body.context) ? body.context : {};

    if (!module || !message) {
      return NextResponse.json({ error: 'Module and message are required' }, { status: 400 });
    }

    const config = await getTenantAIConfig(tenantId);
    const copilot = config.copilots.find((item) => item.module === module && item.enabled);

    if (!copilot) {
      return NextResponse.json({ error: 'No enabled copilot for this module' }, { status: 404 });
    }

    const prompt = [
      `You are the ${copilot.label || MODULE_TITLES[module] || module} copilot inside a multi-tenant ERP.`,
      `Module: ${MODULE_TITLES[module] || module}`,
      `Allowed intents: ${copilot.allowedIntents.join(', ') || 'general assistance'}`,
      `Data sources: ${copilot.dataSources.join(', ') || 'page context only'}`,
      `Response mode: ${copilot.responseMode}`,
      copilot.welcomeMessage ? `Operator guidance: ${copilot.welcomeMessage}` : null,
      'Use only the provided context and tenant-safe ERP knowledge.',
      `Current page context: ${JSON.stringify(context)}`,
      `User request: ${message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const result = await processUserMessage(prompt, [], tenantId, 2);

    await logControlPlaneEvent({
      tenantId,
      integration: 'ai-copilot',
      action: `${module}.respond`,
      status: 'SUCCESS',
      requestData: {
        module,
        copilotId: copilot.id,
        messageLength: message.length,
      },
      responseData: {
        functionCalls: result.functionCalls || [],
      },
    });

    return NextResponse.json({
      module,
      copilotId: copilot.id,
      response: result.response,
      functionCalls: result.functionCalls || [],
    });
  } catch (error: any) {
    console.error('Error running module copilot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
