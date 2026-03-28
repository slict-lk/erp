// FREE AI - Using Ollama instead of OpenAI (no API costs!)
// To use OpenAI instead, change this import to './openai-client'
import { generateChatCompletion, ChatMessage, FunctionDefinition } from './ollama-client';
import { prisma } from '@/lib/prisma';

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
                title: {
                    type: 'string',
                    description: 'Task title',
                },
                description: {
                    type: 'string',
                    description: 'Task description',
                },
                projectId: {
                    type: 'string',
                    description: 'Project ID to assign the task to',
                },
                priority: {
                    type: 'string',
                    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                    description: 'Task priority',
                },
            },
            required: ['title', 'projectId'],
        },
    },
];

/**
 * Execute a function called by the AI agent
 */
export async function executeAgentFunction(
    functionName: string,
    args: Record<string, any>,
    tenantId: string
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

/**
 * Process a user message and generate AI response with function calling
 */
export async function processUserMessage(
    message: string,
    conversationHistory: ChatMessage[],
    tenantId: string,
    maxIterations: number = 3
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

        // Check for Groq FIRST
        const groqApiKey = process.env.GROQ_API_KEY;
        let assistantMessage: any;
        let finishReason = 'stop';

        if (groqApiKey) {
            try {
                const { getGroqEngine } = require('./groq-engine');
                const groqEngine = getGroqEngine();
                // Ensure initialized (optimistic)
                await groqEngine.initialize();

                // Strict sanitization: ensure lowercase roles and valid content
                const cleanMessages = messages.map(m => ({
                    role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
                    content: m.content || ''
                }));

                console.log('📤 Sending sanitized messages to Groq:', JSON.stringify(cleanMessages, null, 2));

                // Groq adapter returns slightly different format, we need to adapt it
                // Enhanced Groq completion logic
                const result = await groqEngine.generateCompletion(cleanMessages, {
                    temperature: 0.7,
                    maxTokens: 2000,
                });

                // Standardizing response format and checking for pseudo-function calls in content 
                // (until the Groq adapter fully supports native tool usage)
                assistantMessage = {
                    role: 'assistant',
                    content: result.response,
                    function_call: null
                };

                // Simple regex pattern for common AI "thought" about calling tools
                if (result.response.includes('CALL_FUNCTION:') || result.response.includes('TOOL:')) {
                    // This is a placeholder for more advanced heuristic parsing
                    console.log('🔍 Potential function call detected in Groq text response');
                }
            } catch (error: any) {
                console.error('Groq failed in chat-agent:', error);
                // Fallback or throw? User requested NO fallback to offline mode.
                throw new Error(`Groq failed: ${error.message || String(error)}`);
            }
        } else {
            // Default to Ollama
            const completion = await generateChatCompletion(messages, {
                functions: AGENT_FUNCTIONS,
                functionCall: 'auto',
            });
            const choice = completion.choices[0];
            finishReason = choice.finish_reason;
            assistantMessage = choice.message;
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
            const functionResult = await executeAgentFunction(functionName, functionArgs, tenantId);

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
