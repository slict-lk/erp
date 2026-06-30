// FREE AI - Using Ollama instead of OpenAI (no API costs!)
// To use OpenAI instead, change this import to './openai-client'
import { generateChatCompletion, ChatMessage, FunctionDefinition } from './ollama-client';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import fs from 'fs';

// Re-export ChatMessage for use in other modules
export type { ChatMessage };

/**
 * Available tools/functions that the AI agent can call
 */
export const AGENT_FUNCTIONS: FunctionDefinition[] = [
    {
        name: 'get_sales_summary',
        description: 'Get sales summary for a specific time period',
        parameters: {
            type: 'object',
            properties: {
                period: {
                    type: 'string',
                    enum: ['today', 'week', 'month', 'quarter', 'year'],
                    description: 'The time period for the sales summary',
                },
            },
            required: ['period'],
        },
    },
    {
        name: 'get_customer_info',
        description: 'Get detailed information about a customer',
        parameters: {
            type: 'object',
            properties: {
                customerId: {
                    type: 'string',
                    description: 'The ID of the customer',
                },
            },
            required: ['customerId'],
        },
    },
    {
        name: 'search_customers',
        description: 'Search for customers by name or email',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query (name or email)',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_recent_invoices',
        description: 'Get list of recent invoices',
        parameters: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Number of invoices to retrieve (default: 10)',
                },
                status: {
                    type: 'string',
                    enum: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'],
                    description: 'Filter by invoice status',
                },
            },
        },
    },
    {
        name: 'get_inventory_status',
        description: 'Get current inventory status and low stock alerts',
        parameters: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    description: 'Filter by product category (optional)',
                },
            },
        },
    },
    {
        name: 'get_accounting_summary',
        description: 'Get a high-level summary of accounting health (receivables, payables, recent payments)',
        parameters: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'get_project_status',
        description: 'Get status summary of active projects and task progress',
        parameters: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'create_task',
        description: 'Create a new task in the project management system',
        parameters: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Task title' },
                description: { type: 'string', description: 'Task description' },
                projectId: { type: 'string', description: 'Project ID to assign the task' },
                priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], description: 'Priority' },
            },
            required: ['title', 'projectId'],
        },
    },
    {
        name: 'get_automation_status',
        description: 'Get counts and status of active business automations/workflows',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_ai_module_overview',
        description: 'Get high-level health of the AI module (approvals, failed runs, readiness)',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'get_pending_tasks',
        description: 'Get list of pending tasks and approvals assigned to you',
        parameters: { type: 'object', properties: {} },
    },

    {
        name: 'generate_sql_query',
        description: 'Generate and execute a SQL query to answer questions about any data in the database when no specific function exists',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The natural language question to convert to SQL',
                },
            },
            required: ['query'],
        },
    },
];
/**
 * Execute a function called by the AI agent
 */


export async function executeAgentFunction(
    functionName: string,
    args: Record<string, any>,
    tenantId: string,
    userId?: string
): Promise<any> {
    console.log(`Executing function: ${functionName}`, args);

    try {
        switch (functionName) {
            case 'get_sales_summary':
                return await getSalesSummary(args.period, tenantId);

            case 'get_customer_info':
                return await getCustomerInfo(args.customerId, tenantId);

            case 'search_customers':
                return await searchCustomers(args.query, tenantId);

            case 'get_recent_invoices':
                return await getRecentInvoices(args.limit || 10, args.status, tenantId);

            case 'get_inventory_status':
                return await getInventoryStatus(args.category, tenantId);

            case 'get_accounting_summary':
                return await getAccountingSummary(tenantId);

            case 'get_project_status':
                return await getProjectStatus(tenantId);

            case 'create_task':
                return await createTask(args, tenantId);

            case 'get_automation_status':
                return await getAutomationStatus(tenantId);

            case 'get_ai_module_overview':
                return await getAIModuleOverview(tenantId);

            case 'get_pending_tasks':
                return await getPendingTasks(tenantId, userId);
              

            case 'generate_sql_query':
                return await executeSQLQuery(args.query, tenantId);

            default:
                return { error: `Unknown function: ${functionName}` };              

        }
    } catch (error: any) {
        console.error(`Error executing ${functionName}:`, error);
        return { error: error.message };
    }
}

// Function implementations

async function getSalesSummary(period: string, tenantId: string) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const orders = await prisma.salesOrder.findMany({
        where: {
            tenantId,
            createdAt: {
                gte: startDate,
            },
        },
    });

    const totalRevenue = orders.reduce((sum: number, order) => sum + (order.grandTotal || 0), 0);
    const totalOrders = orders.length;

    return {
        period,
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
}

async function getCustomerInfo(customerId: string, tenantId: string) {
    const customer = await prisma.customer.findFirst({
        where: {
            id: customerId,
            tenantId,
        },
    });

    if (!customer) {
        return { error: 'Customer not found' };
    }

    return customer;
}

async function searchCustomers(query: string, tenantId: string) {
    const customers = await prisma.customer.findMany({
        where: {
            tenantId,
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                {
                    email: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
            ],
        },
        take: 10,
    });

    return customers;
}

async function getRecentInvoices(limit: number, status: string | undefined, tenantId: string) {
    const invoices = await prisma.invoice.findMany({
        where: {
            tenantId,
            ...(status && { status: status as any }),
        },
        take: limit,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            customer: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });

    return invoices;
}

async function getInventoryStatus(category: string | undefined, tenantId: string) {
    const products = await prisma.product.findMany({
        where: {
            tenantId,
            isActive: true,
            ...(category && { category }),
        },
        select: {
            id: true,
            name: true,
            sku: true,
            stockQty: true,
            minStockQty: true,
        },
    });

    const lowStockProducts = products.filter(p => p.stockQty <= p.minStockQty);

    return {
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.map(p => ({
            name: p.name,
            sku: p.sku,
            currentStock: p.stockQty,
            minRequired: p.minStockQty
        })).slice(0, 10),
        message: lowStockProducts.length > 0 
            ? `Found ${lowStockProducts.length} items at or below minimum stock levels.`
            : 'All inventory levels are currently healthy.'
    };
}

async function getAccountingSummary(tenantId: string) {
    const [invoices, payments] = await Promise.all([
        prisma.invoice.findMany({
            where: { tenantId, status: { in: ['OPEN', 'OVERDUE', 'PAID'] } },
            select: { total: true, amountDue: true, status: true }
        }),
        prisma.payment.findMany({
            where: { tenantId },
            take: 5,
            orderBy: { paymentDate: 'desc' }
        })
    ]);

    const totalReceivables = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const totalRevenue = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.total, 0);

    return {
        totalReceivables,
        totalRevenue,
        recentPaymentsCount: payments.length,
        topPayments: payments.map(p => ({ amount: p.amount, date: p.paymentDate })),
        healthScore: totalReceivables > totalRevenue * 0.5 ? 'CAUTION' : 'HEALTHY'
    };
}

async function getProjectStatus(tenantId: string) {
    const [projects, tasks] = await Promise.all([
        prisma.project.findMany({
            where: { tenantId, status: { not: 'COMPLETED' } },
            select: { id: true, name: true, status: true }
        }),
        prisma.task.findMany({
            where: { tenantId },
            select: { status: true }
        })
    ]);

    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return {
        activeProjectsCount: projects.length,
        activeProjects: projects.map(p => ({ name: p.name, status: p.status })),
        overallTaskCompletion: `${completionRate.toFixed(1)}%`,
        totalTasks: tasks.length
    };
}

async function createTask(args: any, tenantId: string) {
    const task = await prisma.task.create({
        data: {
            title: args.title,
            description: args.description,
            projectId: args.projectId,
            priority: args.priority || 'MEDIUM',
            status: 'TODO',
            tenantId,
        },
    });

    return {
        success: true,
        task,
    };
}

// AI Module & Task Tools

async function getAutomationStatus(tenantId: string) {
    const db = prisma as any;
    const workflows = await db.studioWorkflow.findMany({
        where: { tenantId },
        select: { name: true, isActive: true, triggerType: true }
    });

    const active = workflows.filter((w: any) => w.isActive).length;
    const paused = workflows.length - active;

    return {
        total: workflows.length,
        active,
        paused,
        message: `There are currently ${active} live automations and ${paused} paused workflows.`,
        workflows: workflows.map((w: any) => ({ name: w.name, status: w.isActive ? 'Live' : 'Paused' }))
    };
}

async function getAIModuleOverview(tenantId: string) {
    const db = prisma as any;
    
    // Approvals are in Tenant settings JSON
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true }
    });
    
    const aiConfig = ((tenant?.settings as any)?.aiControlPlane) || {};
    const pendingApprovals = (aiConfig.pendingApprovals || []).length;

    const [workflows, executions, agents] = await Promise.all([
        db.studioWorkflow.count({ where: { tenantId, isActive: true } }),
        db.workflowExecution.count({ where: { workflow: { tenantId }, status: 'failed' } }),
        db.languageModel.count({ where: { tenantId, isActive: true } })
    ]);

    return {
        liveAutomations: workflows,
        pendingApprovals,
        failedRuns: executions,
        activeAgents: agents,
        summary: `The AI module has ${workflows} live automations, ${pendingApprovals} pending approvals, and ${executions} recorded failures that might need attention.`
    };
}

async function getPendingTasks(tenantId: string, userId?: string) {
    if (!userId) return { error: 'User context missing' };
    const db = prisma as any;

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true }
    });
    
    const aiConfig = ((tenant?.settings as any)?.aiControlPlane) || {};
    const allApprovals = (aiConfig.pendingApprovals || []) as any[];
    const myApprovals = allApprovals.filter(a => 
        a.status === 'PENDING' && (a.assignedToUserId === userId || !a.assignedToUserId)
    );

    const tasks = await prisma.task.findMany({
        where: { tenantId, status: { not: 'DONE' }, assigneeId: userId },
        take: 5
    });

    return {
        approvals: myApprovals.map(a => ({ title: a.title, risk: a.riskScore })),
        assignedTasks: tasks.map(t => ({ title: t.title, priority: t.priority })),
        count: myApprovals.length + tasks.length,
        message: `You have ${myApprovals.length} pending approvals and ${tasks.length} active tasks assigned to you.`
    };
}

/**
 * Process a user message and generate AI response with function calling
 */
export async function processUserMessage(
    message: string,
    conversationHistory: ChatMessage[],
    tenantId: string,
    userId?: string,
    maxIterations: number = 3,
    requestedModelId?: string
): Promise<{ response: string; functionCalls?: any[] }> {
    const messages: ChatMessage[] = [
        {
            role: 'system',
            content: `You are an intelligent AI assistant for a comprehensive ERP system. You help users with:
- Sales and customer management
- Inventory tracking
- Financial analysis
- HR and employee management
- Project management
- And all other ERP modules

Be helpful, concise, and professional. When asked to perform actions or retrieve data, use the available functions. 
Always format numbers as currency when appropriate. Provide actionable insights when presenting data.`,
        },
        ...conversationHistory,
        {
            role: 'user',
            content: message,
        },
    ];

    let iterations = 0;
    let functionCalls: any[] = [];

    while (iterations < maxIterations) {
        iterations++;

        // Check for tenant-configured default model (Google, Groq, etc.)
        let assistantMessage: any = null;
        let finishReason = 'stop';

        const configuredModel = requestedModelId
            ? await prisma.languageModel.findFirst({
                where: { tenantId, id: requestedModelId, isActive: true },
                select: { provider: true, modelId: true, apiKey: true },
            })
            : await prisma.languageModel.findFirst({
                where: { tenantId, isActive: true },
                orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
                select: { provider: true, modelId: true, apiKey: true },
            });

        const provider = configuredModel?.provider || null;

        // ── Google Gemini path ──
        if (provider === 'GOOGLE' && configuredModel?.apiKey) {
            try {
                const { generateGeminiCompletion } = require('./google-engine');
                const cleanMessages = messages.filter(m => ['user', 'assistant', 'system'].includes(m.role.toLowerCase())).map(m => ({
                    role: m.role.toLowerCase() as any,
                    content: m.content || '',
                    name: (m as any).name,
                    function_call: (m as any).function_call
                }));

                const result = await generateGeminiCompletion(cleanMessages, {
                    apiKey: configuredModel.apiKey,
                    model: configuredModel.modelId || undefined,
                    temperature: 0.7,
                    maxTokens: 2000,
                    tools: AGENT_FUNCTIONS
                });

                if (result.function_call) {
                    finishReason = 'function_call';
                    assistantMessage = {
                        role: 'assistant',
                        content: '',
                        function_call: result.function_call
                    };
                } else {
                    assistantMessage = {
                        role: 'assistant',
                        content: result.response,
                        function_call: null
                    };
                }
            } catch (error: any) {
                console.error('Gemini failed in chat-agent, returning explicit error:', error);
                assistantMessage = {
                    role: 'assistant',
                    content: `⚠️ Gemini API Error: ${error.message || error.toString()}`,
                    function_call: null
                };
            }
        }

        // ── Groq path ──
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!assistantMessage && groqApiKey) {
            try {
                const { getGroqEngine } = require('./groq-engine');
                const groqEngine = getGroqEngine();
                // Ensure initialized (optimistic)
                await groqEngine.initialize();

                // Strict sanitization: ensure lowercase roles and valid content
                const cleanMessages = messages.filter(m => ['user', 'assistant', 'system'].includes(m.role.toLowerCase())).map(m => ({
                    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
                    content: m.content || ''
                }));

                console.log('📤 Sending sanitized messages to Groq:', JSON.stringify(cleanMessages, null, 2));

                const result = await groqEngine.generateCompletion(cleanMessages, {
                    temperature: 0.7,
                    maxTokens: 2000,
                });

                assistantMessage = {
                    role: 'assistant',
                    content: result.response,
                    function_call: null
                };

                // Simple regex pattern for common AI "thought" about calling tools
                if (result.response.includes('CALL_FUNCTION:') || result.response.includes('TOOL:')) {
                    console.log('🔍 Potential function call detected in Groq text response');
                }
            } catch (error: any) {
                console.error('Groq failed in chat-agent:', error);
                // Fall through to Ollama below
            }
        }

        // ── Ollama fallback ──
        if (!assistantMessage) {
            try {
                const completion = await generateChatCompletion(messages, {
                    functions: AGENT_FUNCTIONS,
                    functionCall: 'auto',
                });
                const choice = completion.choices[0];
                finishReason = choice.finish_reason;
                assistantMessage = choice.message;
            } catch (ollamaError: any) {
                console.error('Ollama fallback failed:', ollamaError);
                assistantMessage = {
                    role: 'assistant',
                    content: `⚠️ Ollama is not running. To use the Local Ollama model, please start Ollama on your machine (http://localhost:11434).\n\nAlternatively, switch to a cloud model (Gemini or Groq) using the model selector in the chat header.`,
                    function_call: null,
                };
            }
        }

        if (finishReason === 'function_call' && assistantMessage.function_call) {
            // AI wants to call a function
            const functionName = assistantMessage.function_call.name;
            const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');

            // Add the assistant's function call to messages
            messages.push({
                role: 'assistant',
                content: '',
                function_call: assistantMessage.function_call,
            } as any);

            // Execute the function
            const functionResult = await executeAgentFunction(functionName, functionArgs, tenantId, userId);

            functionCalls.push({
                name: functionName,
                arguments: functionArgs,
                result: functionResult,
            });

            // Add function result to messages
            messages.push({
                role: 'function',
                name: functionName,
                content: JSON.stringify(functionResult),
            });
        } else {
            // AI has finished responding
            return {
                response: assistantMessage.content || 'I apologize, I could not generate a response.',
                functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
            };
        }
    }

    // If we hit max iterations, return what we have
    return {
        response: 'I processed your request but need more information to complete it. Please try rephrasing your question.',
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
}



async function executeSQLQuery(naturalLanguageQuery: string, tenantId: string) {
    const { generateSQLQuery } = await import('./erp-tasks');
    
    let schemaDescription = '';
    const dictPath = '/root/db_schema.txt';
    
    if (fs.existsSync(dictPath)) {
        schemaDescription = fs.readFileSync(dictPath, 'utf8');
    } else {
        const schemaRows = await prisma.$queryRaw<any[]>(
            Prisma.sql`SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
            LIMIT 500`
        );
        schemaDescription = (schemaRows as any[])
            .map((r: any) => `${r.table_name}.${r.column_name} (${r.data_type})`)
            .join('\n');
    }

    const result = await generateSQLQuery(naturalLanguageQuery, schemaDescription);
    if (!result.query) return { error: 'Could not generate SQL query' };
    
    try {
        const data = await prisma.$queryRawUnsafe(result.query);
        return { data, explanation: result.explanation };
    } catch (error: any) {
        return { error: `Query failed: ${error.message}` };
    }
}
