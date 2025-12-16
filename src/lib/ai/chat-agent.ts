import { PrismaClient } from '@prisma/client';
import { GroqEngine } from './groq-engine';
import { generateChatCompletion, ChatMessage, FunctionDefinition } from './ollama-client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

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
                warehouseId: {
                    type: 'string',
                    description: 'Filter by specific warehouse (optional)',
                },
            },
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
    // HR Functions
    {
        name: 'get_employee_list',
        description: 'Get list of employees, optionally filtered by department',
        parameters: {
            type: 'object',
            properties: {
                department: {
                    type: 'string',
                    description: 'Department name to filter by',
                },
            },
        },
    },
    {
        name: 'get_leave_requests',
        description: 'Get pending leave requests',
        parameters: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['PENDING', 'APPROVED', 'REJECTED'],
                    description: 'Filter by status (default: PENDING)',
                },
            },
        },
    },
    // Accounting Functions
    {
        name: 'get_financial_summary',
        description: 'Get financial summary (income, expenses, profit) for a period',
        parameters: {
            type: 'object',
            properties: {
                period: {
                    type: 'string',
                    enum: ['month', 'quarter', 'year'],
                    description: 'Time period',
                },
            },
            required: ['period'],
        },
    },
    // Hotel Functions
    {
        name: 'check_room_availability',
        description: 'Check room availability for hotel',
        parameters: {
            type: 'object',
            properties: {
                checkIn: {
                    type: 'string',
                    description: 'Check-in date (YYYY-MM-DD)',
                },
                checkOut: {
                    type: 'string',
                    description: 'Check-out date (YYYY-MM-DD)',
                },
                roomType: {
                    type: 'string',
                    description: 'Type of room (optional)',
                },
            },
            required: ['checkIn', 'checkOut'],
        },
    },
    // Manufacturing Functions
    {
        name: 'get_production_status',
        description: 'Get status of active production orders',
        parameters: {
            type: 'object',
            properties: {},
        },
    },
    // Property Management
    {
        name: 'search_properties',
        description: 'Search real estate properties',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query (location, type)',
                },
                status: {
                    type: 'string',
                    enum: ['AVAILABLE', 'SOLD', 'RENTED'],
                    description: 'Property status',
                },
            },
            required: ['query'],
        },
    },
    {
        name: 'get_model_schema',
        description: 'Get the schema definition for a specific data model',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: 'The name of the data model (e.g., "employee", "customer")',
                },
            },
            required: ['model'],
        },
    },
    // Generic CRUD Functions
    {
        name: 'list_records',
        description: 'List records for a specific data model',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: 'The name of the data model (e.g., "customer", "invoice", "product")',
                },
                filters: {
                    type: 'object',
                    description: 'JSON object with filter criteria (Prisma where clause)',
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of records to return (default: 10)',
                },
            },
            required: ['model'],
        },
    },
    {
        name: 'get_record',
        description: 'Get a single record by ID',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: 'The name of the data model',
                },
                id: {
                    type: 'string',
                    description: 'The ID of the record',
                },
            },
            required: ['model', 'id'],
        },
    },
    {
        name: 'create_record',
        description: 'Create a new record',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: 'The name of the data model',
                },
                data: {
                    type: 'object',
                    description: 'JSON object with data for the new record',
                },
            },
            required: ['model', 'data'],
        },
    },
    {
        name: 'update_record',
        description: 'Update an existing record',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: 'The name of the data model',
                },
                id: {
                    type: 'string',
                    description: 'The ID of the record to update',
                },
                data: {
                    type: 'object',
                    description: 'JSON object with updated data',
                },
            },
            required: ['model', 'id', 'data'],
        },
    },
    {
        name: 'delete_record',
        description: 'Delete a record',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: 'The name of the data model',
                },
                id: {
                    type: 'string',
                    description: 'The ID of the record to delete',
                },
            },
            required: ['model', 'id'],
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
                return await getInventoryStatus(args.warehouseId, tenantId);

            case 'create_task':
                return await createTask(args, tenantId);

            case 'get_employee_list':
                return await getEmployeeList(args.department, tenantId);

            case 'get_leave_requests':
                return await getLeaveRequests(args.status, tenantId);

            case 'get_financial_summary':
                return await getFinancialSummary(args.period, tenantId);

            case 'check_room_availability':
                return await checkRoomAvailability(args.checkIn, args.checkOut, args.roomType, tenantId);

            case 'get_production_status':
                return await getProductionStatus(tenantId);

            case 'search_properties':
                return await searchProperties(args.query, args.status, tenantId);

            case 'get_model_schema':
                return await getModelSchema(args.model);

            // Generic CRUD Handlers
            case 'list_records':
                return await listRecords(args.model, args.filters, args.limit, tenantId);

            case 'get_record':
                return await getRecord(args.model, args.id, tenantId);

            case 'create_record':
                return await createRecord(args.model, args.data, tenantId);

            case 'update_record':
                return await updateRecord(args.model, args.id, args.data, tenantId);

            case 'delete_record':
                return await deleteRecord(args.model, args.id, tenantId);

            default:
                return { error: `Unknown function: ${functionName}` };
        }
    } catch (error: any) {
        console.error(`Error executing ${functionName}:`, error);
        return { error: error.message };
    }
}

// Function implementations

// --- Generic CRUD Implementations ---

function getPrismaModel(modelName: string) {
    // Convert to camelCase if needed, though usually passed as such
    const model = (prisma as any)[modelName];
    if (!model) {
        throw new Error(`Model '${modelName}' not found in database schema.`);
    }
    return model;
}

async function listRecords(modelName: string, filters: any = {}, limit: number = 10, tenantId: string) {
    const model = getPrismaModel(modelName);

    // Ensure tenant isolation if the model has tenantId
    // We can check if 'tenantId' is a valid field, but for safety, we assume most models need it.
    // However, some global models might not. We'll try to apply it if filters don't explicitly handle it.
    // A safer way is to just pass filters and let the AI handle tenantId, OR enforce it here.
    // Enforcing it is safer.

    const queryFilters = { ...filters };

    // Simple check: does the model likely have tenantId? 
    // We can't easily check schema at runtime without DMMF. 
    // Strategy: Try to add tenantId to where clause. If it fails, it fails.
    // BETTER STRATEGY: The AI Agent is trusted (internal tool). 
    // We will instruct the AI to ALWAYS include tenantId in filters for tenant-specific data.
    // But to be safe, we can default to adding it if not present, assuming the model has it.
    // For now, we'll trust the AI but append tenantId if the user didn't provide it in filters 
    // AND we are not querying a known global model (like User, maybe?).

    if (!queryFilters.tenantId) {
        queryFilters.tenantId = tenantId;
    }

    try {
        const records = await model.findMany({
            where: queryFilters,
            take: limit,
            orderBy: { createdAt: 'desc' } // Default sort
        });
        return records;
    } catch (error: any) {
        // If tenantId caused an error (model doesn't have it), retry without it?
        // No, that's dangerous. Better to return the error.
        return { error: `Failed to list records: ${error.message}` };
    }
}

async function getRecord(modelName: string, id: string, tenantId: string) {
    const model = getPrismaModel(modelName);
    try {
        const record = await model.findUnique({
            where: { id },
        });

        // Verify tenant ownership
        if (record && record.tenantId && record.tenantId !== tenantId) {
            return { error: 'Unauthorized: Record belongs to another tenant' };
        }

        return record || { error: 'Record not found' };
    } catch (error: any) {
        return { error: `Failed to get record: ${error.message}` };
    }
}

async function createRecord(modelName: string, data: any, tenantId: string) {
    const model = getPrismaModel(modelName);
    try {
        // Enforce tenantId
        const recordData = { ...data, tenantId };

        // Special handling for Employee model: auto-generate employeeId if missing
        if (modelName.toLowerCase() === 'employee' && !recordData.employeeId) {
            recordData.employeeId = `EMP-${Date.now().toString().slice(-6)}`;
        }

        const record = await model.create({
            data: recordData,
        });
        return record;
    } catch (error: any) {
        return { error: `Failed to create record: ${error.message}` };
    }
}

async function updateRecord(modelName: string, id: string, data: any, tenantId: string) {
    const model = getPrismaModel(modelName);
    try {
        // First check ownership
        const existing = await model.findUnique({ where: { id } });
        if (!existing) return { error: 'Record not found' };
        if (existing.tenantId && existing.tenantId !== tenantId) {
            return { error: 'Unauthorized' };
        }

        const record = await model.update({
            where: { id },
            data: data,
        });
        return record;
    } catch (error: any) {
        return { error: `Failed to update record: ${error.message}` };
    }
}

async function deleteRecord(modelName: string, id: string, tenantId: string) {
    const model = getPrismaModel(modelName);
    try {
        // First check ownership
        const existing = await model.findUnique({ where: { id } });
        if (!existing) return { error: 'Record not found' };
        if (existing.tenantId && existing.tenantId !== tenantId) {
            return { error: 'Unauthorized' };
        }

        await model.delete({
            where: { id },
        });
        return { success: true, message: 'Record deleted successfully' };
    } catch (error: any) {
        return { error: `Failed to delete record: ${error.message}` };
    }
}

async function getModelSchema(modelName: string) {
    try {
        // In a real production app, we would use a pre-generated schema definition or DMMF.
        // For this dev environment, we'll read the schema file directly.
        const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');

        if (!fs.existsSync(schemaPath)) {
            return { error: 'Schema file not found. Cannot retrieve model definition.' };
        }

        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

        // Find the model definition block
        // Regex to find "model ModelName {" and capture until the closing "}"
        // This is a simple regex and might fail on complex nested structures, but Prisma schema is usually flat.
        // We need to handle case-insensitivity for the model name search, but the actual definition is case-sensitive.
        // We'll search for "model [CaseInsensitiveName]"

        const lines = schemaContent.split('\n');
        let inModel = false;
        let modelBlock = [];
        let foundModelName = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith(`model ${modelName.toLowerCase()} `) ||
                trimmed.toLowerCase().startsWith(`model ${modelName.toLowerCase()}{`)) {
                inModel = true;
                foundModelName = trimmed.split(' ')[1];
                modelBlock.push(line);
                continue;
            }

            if (inModel) {
                modelBlock.push(line);
                if (trimmed === '}') {
                    break;
                }
            }
        }

        if (modelBlock.length === 0) {
            return { error: `Model '${modelName}' not found in schema.` };
        }

        // Parse the block to extract fields
        const fields = modelBlock.map(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('model ') || trimmed === '}' || trimmed.startsWith('@@')) {
                return null;
            }

            // Simple parser: Name Type Attributes
            const parts = trimmed.split(/\s+/);
            if (parts.length < 2) return null;

            const name = parts[0];
            const type = parts[1];
            const isOptional = type.endsWith('?');
            const isArray = type.endsWith('[]');
            const attributes = parts.slice(2).join(' ');

            return {
                name,
                type: type.replace('?', '').replace('[]', ''),
                isOptional,
                isArray,
                attributes
            };
        }).filter(f => f !== null);

        return {
            model: foundModelName,
            fields: fields,
            raw: modelBlock.join('\n')
        };

    } catch (error: any) {
        return { error: `Failed to get model schema: ${error.message}` };
    }
}

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

async function getInventoryStatus(warehouseId: string | undefined, tenantId: string) {
    const products = await prisma.product.findMany({
        where: {
            tenantId,
        },
        select: {
            id: true,
            name: true,
            sku: true,
        },
    });

    // Note: Stock quantity tracking would need to be implemented in warehouse system
    return {
        totalProducts: products.length,
        lowStockCount: 0,
        lowStockProducts: [],
        message: 'Inventory tracking available in warehouse module',
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

// --- New Function Implementations ---

async function getEmployeeList(department: string | undefined, tenantId: string) {
    const employees = await prisma.employee.findMany({
        where: {
            tenantId,
            ...(department && { department: { name: { contains: department, mode: 'insensitive' } } }),
        },
        include: {
            department: true,
        },
        take: 20,
    });
    return employees;
}

async function getLeaveRequests(status: string | undefined, tenantId: string) {
    const requests = await prisma.leaveRequest.findMany({
        where: {
            tenantId,
            status: (status as any) || 'PENDING',
        },
        include: {
            employee: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
    return requests;
}

async function getFinancialSummary(period: string, tenantId: string) {
    // Mock implementation - replace with real accounting queries
    // In a real app, you would query the General Ledger or Transaction table
    return {
        period,
        income: 150000,
        expenses: 85000,
        netProfit: 65000,
        pendingInvoices: 12000,
        note: "This is a simulated financial summary based on the requested period."
    };
}

async function checkRoomAvailability(checkIn: string, checkOut: string, roomType: string | undefined, tenantId: string) {
    // Simplified availability check
    const availableRooms = await prisma.hotelRoom.findMany({
        where: {
            tenantId,
            status: 'AVAILABLE',
            ...(roomType && { type: { contains: roomType, mode: 'insensitive' } }),
        },
        take: 5,
    });

    return {
        checkIn,
        checkOut,
        availableRoomsCount: availableRooms.length,
        rooms: availableRooms.map(r => ({ number: r.roomNumber, type: r.roomType, price: r.basePrice })),
    };
}

async function getProductionStatus(tenantId: string) {
    // Mock implementation for manufacturing
    return {
        activeOrders: 3,
        completedToday: 1,
        delayedOrders: 0,
        efficiency: "92%",
        orders: [
            { id: "PO-001", product: "Office Chair", status: "IN_PROGRESS", progress: 65 },
            { id: "PO-002", product: "Wooden Desk", status: "SCHEDULED", progress: 0 },
            { id: "PO-003", product: "Bookshelf", status: "IN_PROGRESS", progress: 30 },
        ]
    };
}

async function searchProperties(query: string, status: string | undefined, tenantId: string) {
    const properties = await prisma.property.findMany({
        where: {
            tenantId,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { address: { contains: query, mode: 'insensitive' } },
            ],
            ...(status && { status: status as any }),
        },
        take: 5,
    });
    return properties;
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
Always format numbers as currency when appropriate. Provide actionable insights when presenting data.

You have access to generic CRUD functions (list_records, get_record, create_record, update_record, delete_record) that allow you to interact with ANY data model in the system.
Use these functions when a specific function (like 'get_sales_summary') is not available or when you need to perform direct database operations.

Available Models (use these names for the 'model' parameter):
- tenant, user
- property, propertyViewing, propertyDocument, propertyAmenity, propertyLease, propertyMaintenance, propertyInquiry, propertyAgent, propertyAgentAssignment, propertyFavorite, savedSearch, virtualTour, neighborhoodInsight, propertyView, propertyComparison
- customer, contact, lead, opportunity, quotation, salesOrder, cart, cartItem, posOrder, posOrderItem
- vendor
- ticket, ticketComment
- webPage, blogPost, course, lesson, courseEnrollment
- survey
- smsCampaign
- marketingEvent, eventRegistration
- forumTopic, forumPost
- restaurantTable
- hotelRoom, hotelBooking, guestProfile, folioCharge, frontDeskAction, housekeepingTask, maintenanceRequest, hotelConfig, hotelBranch
- employee, department, jobPosition, leaveRequest, attendance, payroll, performanceReview
- project, task, timesheet
- product, productCategory, productVariant, warehouse, stockMovement, stockAdjustment, stockTransfer, inventoryCount
- invoice, payment, expense, account, transaction, journalEntry, taxRate
- subscription, subscriptionPlan, subscriptionFeature, subscriptionUsage

When creating or updating records, ensure you provide valid JSON data matching the schema.
Always prioritize specific functions over generic CRUD if they exist.`,
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
                const cleanMessages = messages.map(m => {
                    const msg: any = {
                        role: m.role.toLowerCase(),
                        content: m.content || null
                    };
                    if (m.name) msg.name = m.name;
                    if ((m as any).function_call) {
                        const fc = (m as any).function_call;
                        msg.function_call = {
                            name: fc.name,
                            arguments: typeof fc.arguments === 'string' ? fc.arguments : JSON.stringify(fc.arguments)
                        };
                    }
                    return msg;
                });

                console.log('📤 Sending sanitized messages to Groq:', JSON.stringify(cleanMessages, null, 2));

                // Groq adapter returns slightly different format, we need to adapt it
                const result = await groqEngine.generateCompletion(cleanMessages, {
                    temperature: 0.7,
                    maxTokens: 2000,
                    functions: AGENT_FUNCTIONS,
                    functionCall: 'auto'
                });

                assistantMessage = {
                    role: 'assistant',
                    content: result.response,
                    function_call: result.functionCall
                };

                if (result.functionCall) {
                    finishReason = 'function_call';
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
