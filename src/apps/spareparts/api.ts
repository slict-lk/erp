// Spare Parts Shop Module API Functions
// Following Healthcare module pattern

import { prisma } from '@/lib/prisma';
import type {
    CreateCustomerInput,
    CreateInvoiceInput,
    InvoiceItemInput,
    PaymentInput,
    CreatePromotionInput,
    CreateSupplierInput,
    CreatePurchaseOrderInput,
    DashboardStats,
    DateRange,
    SalesSummary,
} from './types';

// ============================================================================
// ID GENERATORS
// ============================================================================

export async function generateCustomerNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await prisma.shopCustomer.count({
        where: {
            tenantId,
            customerNumber: { startsWith: `CUST-${dateStr}` }
        }
    });

    return `CUST-${dateStr}-${String(count + 1).padStart(3, '0')}`;
}

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await prisma.shopInvoice.count({
        where: {
            tenantId,
            invoiceNumber: { startsWith: `INV-${dateStr}` }
        }
    });

    return `INV-${dateStr}-${String(count + 1).padStart(3, '0')}`;
}

export async function generatePONumber(tenantId: string): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await prisma.shopPurchaseOrder.count({
        where: {
            tenantId,
            orderNumber: { startsWith: `PO-${dateStr}` }
        }
    });

    return `PO-${dateStr}-${String(count + 1).padStart(3, '0')}`;
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function getCustomers(tenantId: string, options?: {
    type?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
}) {
    const where: any = { tenantId };

    if (options?.type) {
        where.customerType = options.type;
    }
    if (options?.status) {
        where.status = options.status;
    }
    if (options?.search) {
        where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            { phone: { contains: options.search } },
            { email: { contains: options.search, mode: 'insensitive' } },
            { customerNumber: { contains: options.search, mode: 'insensitive' } },
            { businessName: { contains: options.search, mode: 'insensitive' } },
        ];
    }

    return prisma.shopCustomer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
            _count: {
                select: { invoices: true, vehicleHistory: true }
            }
        }
    });
}

export async function getCustomerById(id: string, tenantId: string) {
    return prisma.shopCustomer.findFirst({
        where: { id, tenantId },
        include: {
            invoices: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { items: true }
            },
            vehicleHistory: true,
            audiences: {
                include: { audience: true }
            }
        }
    });
}

export async function createCustomer(data: CreateCustomerInput & { tenantId: string }) {
    const customerNumber = await generateCustomerNumber(data.tenantId);

    return prisma.shopCustomer.create({
        data: {
            customerNumber,
            name: data.name,
            phone: data.phone,
            email: data.email,
            alternatePhone: data.alternatePhone,
            address: data.address,
            city: data.city,
            postalCode: data.postalCode,
            businessName: data.businessName,
            taxId: data.taxId,
            customerType: data.customerType || 'RETAIL',
            creditLimit: data.creditLimit || 0,
            paymentTermDays: data.paymentTermDays || 0,
            tenantId: data.tenantId,
        }
    });
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerInput>, tenantId: string) {
    return prisma.shopCustomer.update({
        where: { id },
        data: {
            ...data,
        }
    });
}

export async function searchCustomers(query: string, tenantId: string, limit = 10) {
    return prisma.shopCustomer.findMany({
        where: {
            tenantId,
            status: 'ACTIVE',
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { customerNumber: { contains: query, mode: 'insensitive' } },
            ]
        },
        take: limit,
        orderBy: { name: 'asc' }
    });
}

export async function addCustomerVehicle(customerId: string, data: {
    make: string;
    model: string;
    year: number;
    plateNumber?: string;
    vin?: string;
}) {
    return prisma.shopCustomerVehicle.create({
        data: {
            customerId,
            ...data
        }
    });
}

// ============================================================================
// SALES & INVOICES
// ============================================================================

export async function getInvoices(tenantId: string, options?: {
    status?: string;
    paymentStatus?: string;
    dateFrom?: Date;
    dateTo?: Date;
    customerId?: string;
    source?: string;
    limit?: number;
    offset?: number;
}) {
    const where: any = { tenantId };

    if (options?.status) where.status = options.status;
    if (options?.paymentStatus) where.paymentStatus = options.paymentStatus;
    if (options?.customerId) where.customerId = options.customerId;
    if (options?.source) where.source = options.source;
    if (options?.dateFrom || options?.dateTo) {
        where.createdAt = {};
        if (options?.dateFrom) where.createdAt.gte = options.dateFrom;
        if (options?.dateTo) where.createdAt.lte = options.dateTo;
    }

    return prisma.shopInvoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
        include: {
            customer: true,
            items: true,
            payments: true,
            _count: { select: { items: true } }
        }
    });
}

export async function getInvoiceById(id: string, tenantId: string) {
    return prisma.shopInvoice.findFirst({
        where: { id, tenantId },
        include: {
            customer: true,
            items: true,
            payments: true,
            appliedPromos: {
                include: { promotion: true }
            }
        }
    });
}

export async function createInvoice(data: CreateInvoiceInput & { tenantId: string; createdById: string }) {
    const invoiceNumber = await generateInvoiceNumber(data.tenantId);

    return prisma.shopInvoice.create({
        data: {
            invoiceNumber,
            customerId: data.customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            vehicleInfo: data.vehicleInfo,
            notes: data.notes,
            subtotal: 0,
            total: 0,
            dueAmount: 0,
            createdById: data.createdById,
            tenantId: data.tenantId,
        }
    });
}

export async function addInvoiceItem(invoiceId: string, item: InvoiceItemInput, tenantId: string) {
    console.log('addInvoiceItem called with invoiceId:', invoiceId, 'productId:', item.productId);

    // Get product details
    const product = await (prisma as any).sparePart.findFirst({
        where: { id: item.productId, tenantId }
    });

    if (!product) {
        console.error('Product not found:', item.productId);
        throw new Error('Product not found');
    }

    const unitPrice = item.unitPrice ?? product.salePrice;

    // Calculate Quantity Discount
    const qtyDiscount = await calculateQuantityDiscount(tenantId, item.productId, product.category, item.quantity);
    let qtyDiscountAmount = 0;

    if (qtyDiscount) {
        if (qtyDiscount.discountType === 'PERCENTAGE') {
            qtyDiscountAmount = (unitPrice * item.quantity * qtyDiscount.discountValue) / 100;
        } else {
            // Fixed amount: applied to the total line item (once)
            qtyDiscountAmount = qtyDiscount.discountValue;
        }
        console.log(`Applying quantity discount (${qtyDiscount.promotionName}): ${qtyDiscountAmount}`);
    }

    // Combine with manual discount (if any)
    const manualDiscountPercent = item.discountPercent ?? 0;
    const manualDiscountAmount = (unitPrice * item.quantity * manualDiscountPercent) / 100;

    const discountAmount = manualDiscountAmount + qtyDiscountAmount;

    // Back-calculate total percent for reference (approx)
    const discountPercent = (unitPrice * item.quantity) > 0
        ? (discountAmount / (unitPrice * item.quantity)) * 100
        : 0;

    const subtotal = unitPrice * item.quantity - discountAmount;
    const taxRate = item.taxRate ?? 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const lineTotal = subtotal + taxAmount;

    console.log('Creating item with data:', {
        invoiceId,
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal
    });

    // Create item
    const invoiceItem = await prisma.shopInvoiceItem.create({
        data: {
            invoiceId,
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            quantity: item.quantity,
            unitPrice,
            costPrice: product.costPrice,
            discountPercent,
            discountAmount,
            taxRate,
            taxAmount,
            lineTotal,
            vehicleInfo: item.vehicleInfo,
        }
    });

    console.log('Item created:', invoiceItem);

    // Recalculate invoice totals
    await recalculateInvoiceTotals(invoiceId);

    return invoiceItem;
}

export async function removeInvoiceItem(itemId: string) {
    const item = await prisma.shopInvoiceItem.findUnique({
        where: { id: itemId }
    });

    if (!item) throw new Error('Item not found');

    await prisma.shopInvoiceItem.delete({ where: { id: itemId } });

    // Recalculate invoice totals
    await recalculateInvoiceTotals(item.invoiceId);
}

async function recalculateInvoiceTotals(invoiceId: string) {
    const items = await prisma.shopInvoiceItem.findMany({
        where: { invoiceId }
    });

    console.log('recalculateInvoiceTotals for invoice:', invoiceId, 'items found:', items.length);

    const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal) - Number(item.taxAmount), 0);
    const taxAmount = items.reduce((sum, item) => sum + Number(item.taxAmount), 0);
    const discountAmount = items.reduce((sum, item) => sum + Number(item.discountAmount), 0);
    const total = subtotal + taxAmount;

    const invoice = await prisma.shopInvoice.findUnique({
        where: { id: invoiceId },
        select: { paidAmount: true }
    });

    const paidAmount = Number(invoice?.paidAmount || 0);
    const dueAmount = total - paidAmount;

    console.log('Updating invoice with totals:', { subtotal, taxAmount, total });

    await prisma.shopInvoice.update({
        where: { id: invoiceId },
        data: {
            subtotal,
            taxAmount,
            discountAmount,
            total,
            dueAmount,
            paymentStatus: paidAmount >= total ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'
        }
    });
}

export async function confirmInvoice(id: string, tenantId: string) {
    const invoice = await prisma.shopInvoice.findFirst({
        where: { id, tenantId },
        include: { items: true }
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'DRAFT') throw new Error('Invoice is not in draft status');

    // Deduct stock for each item
    for (const item of invoice.items) {
        await (prisma as any).sparePart.update({
            where: { id: item.productId },
            data: {
                stockQty: { decrement: Number(item.quantity) }
            }
        });

        // Note: StockMovement is not created for SpareParts because StockMovement.productId
        // has a foreign key to the Product table, not SparePart table.
        // Stock quantity is still properly decremented above.
        // TODO: Consider creating a separate SparePartMovement table if movement tracking is needed
    }

    // Update customer total purchases
    if (invoice.customerId) {
        await prisma.shopCustomer.update({
            where: { id: invoice.customerId },
            data: {
                totalPurchases: { increment: Number(invoice.total) }
            }
        });
    }

    return prisma.shopInvoice.update({
        where: { id },
        data: { status: 'CONFIRMED' }
    });
}

export async function recordPayment(invoiceId: string, payment: PaymentInput & { receivedById: string }, tenantId: string) {
    const invoice = await prisma.shopInvoice.findFirst({
        where: { id: invoiceId, tenantId }
    });

    if (!invoice) throw new Error('Invoice not found');

    // Create payment record
    await prisma.shopInvoicePayment.create({
        data: {
            invoiceId,
            amount: payment.amount,
            method: payment.method,
            reference: payment.reference,
            receivedById: payment.receivedById,
        }
    });

    // Update invoice
    const newPaidAmount = Number(invoice.paidAmount) + payment.amount;
    const newDueAmount = Number(invoice.total) - newPaidAmount;

    return prisma.shopInvoice.update({
        where: { id: invoiceId },
        data: {
            paidAmount: newPaidAmount,
            dueAmount: newDueAmount,
            paymentStatus: newPaidAmount >= Number(invoice.total) ? 'PAID' : 'PARTIAL',
            status: newPaidAmount >= Number(invoice.total) ? 'COMPLETED' : invoice.status,
        }
    });
}

export async function cancelInvoice(id: string, reason: string, tenantId: string) {
    const invoice = await prisma.shopInvoice.findFirst({
        where: { id, tenantId },
        include: { items: true }
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Invoice already cancelled');

    // Restore stock if invoice was confirmed
    if (invoice.status === 'CONFIRMED' || invoice.status === 'COMPLETED') {
        for (const item of invoice.items) {
            await (prisma as any).sparePart.update({
                where: { id: item.productId },
                data: {
                    stockQty: { increment: Number(item.quantity) }
                }
            });
        }
    }

    return prisma.shopInvoice.update({
        where: { id },
        data: {
            status: 'CANCELLED',
            internalNotes: reason
        }
    });
}

// ============================================================================
// PROMOTIONS
// ============================================================================

export async function getPromotions(tenantId: string, options?: {
    active?: boolean;
    type?: string;
}) {
    const where: any = { tenantId };

    if (options?.active !== undefined) {
        where.isActive = options.active;
        if (options.active) {
            where.startDate = { lte: new Date() };
            where.OR = [
                { endDate: null },
                { endDate: { gte: new Date() } }
            ];
        }
    }
    if (options?.type) where.type = options.type;

    return prisma.shopPromotion.findMany({
        where,
        orderBy: { priority: 'desc' },
        include: {
            targetProducts: true,
            targetAudiences: { include: { audience: true } },
            _count: { select: { appliedTo: true } }
        }
    });
}

export async function createPromotion(data: CreatePromotionInput & { tenantId: string }) {
    return prisma.shopPromotion.create({
        data: {
            name: data.name,
            description: data.description,
            code: data.code,
            type: data.type,
            discountType: data.discountType,
            discountValue: data.discountValue,
            minimumPurchase: data.minimumPurchase,
            maximumDiscount: data.maximumDiscount,
            usageLimit: data.usageLimit,
            perCustomerLimit: data.perCustomerLimit,
            targetType: data.targetType || 'ALL_PRODUCTS',
            targetCategories: data.targetCategories || [],
            targetBrands: data.targetBrands || [],
            startDate: data.startDate,
            endDate: data.endDate,
            tenantId: data.tenantId,
            targetProducts: data.targetProductIds ? {
                create: data.targetProductIds.map(productId => ({ productId }))
            } : undefined,
            targetAudiences: data.targetAudienceIds ? {
                create: data.targetAudienceIds.map(audienceId => ({ audienceId }))
            } : undefined,
        }
    });
}

export async function getApplicablePromotions(
    tenantId: string,
    customerId: string | null,
    items: { productId: string; category?: string; quantity: number; unitPrice: number }[]
) {
    const now = new Date();

    // Get all active promotions
    const promotions = await prisma.shopPromotion.findMany({
        where: {
            tenantId,
            isActive: true,
            startDate: { lte: now },
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        },
        include: {
            targetProducts: true,
            targetAudiences: true
        },
        orderBy: { priority: 'desc' }
    });

    const cartTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const applicable: typeof promotions = [];

    for (const promo of promotions) {
        // Check minimum purchase
        if (promo.minimumPurchase && cartTotal < Number(promo.minimumPurchase)) continue;

        // Check usage limit
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) continue;

        // Check target type
        if (promo.targetType === 'SPECIFIC_PRODUCTS') {
            const targetProductIds = promo.targetProducts.map(tp => tp.productId);
            const hasTargetProduct = items.some(item => targetProductIds.includes(item.productId));
            if (!hasTargetProduct) continue;
        }

        // Check audience targeting
        if (promo.targetAudiences.length > 0 && customerId) {
            const customerAudiences = await prisma.shopCustomerAudienceMember.findMany({
                where: { customerId },
                select: { audienceId: true }
            });
            const customerAudienceIds = customerAudiences.map(ca => ca.audienceId);
            const targetAudienceIds = promo.targetAudiences.map(ta => ta.audienceId);
            const inTargetAudience = targetAudienceIds.some(id => customerAudienceIds.includes(id));
            if (!inTargetAudience) continue;
        }

        applicable.push(promo);
    }

    return applicable;
}

// ============================================================================
// CUSTOMER AUDIENCES
// ============================================================================

export async function getAudiences(tenantId: string) {
    return prisma.shopCustomerAudience.findMany({
        where: { tenantId },
        include: {
            _count: { select: { members: true, promotions: true } }
        }
    });
}

export async function createAudience(data: {
    name: string;
    description?: string;
    color?: string;
    rules?: any;
    isAutomatic?: boolean;
    tenantId: string;
}) {
    return prisma.shopCustomerAudience.create({
        data: {
            name: data.name,
            description: data.description,
            color: data.color,
            rules: data.rules ?? undefined,
            isAutomatic: data.isAutomatic,
            tenantId: data.tenantId,
        }
    });
}

export async function addCustomerToAudience(customerId: string, audienceId: string) {
    return prisma.shopCustomerAudienceMember.create({
        data: { customerId, audienceId }
    });
}

export async function removeCustomerFromAudience(customerId: string, audienceId: string) {
    return prisma.shopCustomerAudienceMember.deleteMany({
        where: { customerId, audienceId }
    });
}

// ============================================================================
// REORDER SYSTEM
// ============================================================================

export async function getReorderSuggestions(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return prisma.shopReorderSuggestion.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
}

export async function generateReorderSuggestions(tenantId: string) {
    // Get products with low stock (stockQty <= minStockQty)
    const products = await (prisma as any).sparePart.findMany({
        where: {
            tenantId,
            isActive: true,
            stockQty: { lte: (prisma as any).sparePart.fields.minStockQty }
        }
    });

    const suggestions = [];

    for (const product of products) {
        // Check if suggestion already exists
        const existing = await prisma.shopReorderSuggestion.findFirst({
            where: {
                productId: product.id,
                status: 'PENDING',
                tenantId
            }
        });

        if (existing) continue;

        // Calculate average daily sales (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesData = await prisma.shopInvoiceItem.aggregate({
            where: {
                productId: product.id,
                invoice: {
                    tenantId,
                    status: { in: ['CONFIRMED', 'COMPLETED'] },
                    createdAt: { gte: thirtyDaysAgo }
                }
            },
            _sum: { quantity: true }
        });

        const totalSold = Number(salesData._sum.quantity || 0);
        const avgDailySales = totalSold / 30;
        const daysOfStock = avgDailySales > 0 ? Math.floor(product.stockQty / avgDailySales) : 999;

        // Get reorder rule if exists
        const rule = await prisma.shopReorderRule.findFirst({
            where: { productId: product.id, tenantId }
        });

        const reorderQty = rule?.reorderQuantity || Math.ceil(avgDailySales * 30);

        const suggestion = await prisma.shopReorderSuggestion.create({
            data: {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                currentStock: Math.floor(product.stockQty),
                reorderPoint: Math.floor(product.minStockQty),
                suggestedQty: reorderQty,
                avgDailySales,
                daysOfStock,
                tenantId
            }
        });

        suggestions.push(suggestion);
    }

    return suggestions;
}

export async function approveReorderSuggestion(id: string, userId: string, tenantId: string) {
    return prisma.shopReorderSuggestion.update({
        where: { id },
        data: {
            status: 'APPROVED',
            processedById: userId,
            processedAt: new Date()
        }
    });
}

export async function rejectReorderSuggestion(id: string, userId: string, reason: string, tenantId: string) {
    return prisma.shopReorderSuggestion.update({
        where: { id },
        data: {
            status: 'REJECTED',
            processedById: userId,
            processedAt: new Date(),
            rejectionReason: reason
        }
    });
}

// ============================================================================
// SUPPLIERS & PURCHASE ORDERS
// ============================================================================

export async function getSuppliers(tenantId: string) {
    return prisma.shopSupplier.findMany({
        where: { tenantId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        include: {
            _count: { select: { purchaseOrders: true } }
        }
    });
}

export async function createSupplier(data: CreateSupplierInput & { tenantId: string }) {
    return prisma.shopSupplier.create({ data });
}

export async function getPurchaseOrders(tenantId: string, options?: { status?: string }) {
    const where: any = { tenantId };
    if (options?.status) where.status = options.status;

    return prisma.shopPurchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            supplier: true,
            items: true
        }
    });
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput & { tenantId: string; createdById: string }) {
    const orderNumber = await generatePONumber(data.tenantId);

    // Calculate totals
    let subtotal = 0;
    const itemsData = [];

    for (const item of data.items) {
        const product = await (prisma as any).sparePart.findUnique({
            where: { id: item.productId }
        });

        if (!product) throw new Error(`Product ${item.productId} not found`);

        const lineTotal = item.quantity * item.unitCost;
        subtotal += lineTotal;

        itemsData.push({
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            quantity: item.quantity,
            unitCost: item.unitCost,
            lineTotal
        });
    }

    return prisma.shopPurchaseOrder.create({
        data: {
            orderNumber,
            supplierId: data.supplierId,
            subtotal,
            total: subtotal,
            expectedDate: data.expectedDate,
            notes: data.notes,
            createdById: data.createdById,
            tenantId: data.tenantId,
            items: {
                create: itemsData
            }
        },
        include: { items: true, supplier: true }
    });
}

export async function receivePurchaseOrder(
    id: string,
    items: { itemId: string; receivedQty: number }[],
    tenantId: string
) {
    const po = await prisma.shopPurchaseOrder.findFirst({
        where: { id, tenantId },
        include: { items: true }
    });

    if (!po) throw new Error('Purchase order not found');

    let allReceived = true;

    for (const received of items) {
        const poItem = po.items.find(i => i.id === received.itemId);
        if (!poItem) continue;

        const newReceivedQty = Number(poItem.receivedQty) + received.receivedQty;

        // Update PO item
        await prisma.shopPurchaseOrderItem.update({
            where: { id: received.itemId },
            data: { receivedQty: newReceivedQty }
        });

        // Update product stock
        await prisma.product.update({
            where: { id: poItem.productId },
            data: { stockQty: { increment: received.receivedQty } }
        });

        // Create stock movement
        const warehouse = await prisma.warehouse.findFirst({ where: { tenantId } });
        if (warehouse) {
            await prisma.stockMovement.create({
                data: {
                    productId: poItem.productId,
                    warehouseId: warehouse.id,
                    type: 'IN',
                    quantity: received.receivedQty,
                    reference: `PO: ${po.orderNumber}`,
                    tenantId
                }
            });
        }

        if (newReceivedQty < Number(poItem.quantity)) {
            allReceived = false;
        }
    }

    // Update PO status
    return prisma.shopPurchaseOrder.update({
        where: { id },
        data: {
            status: allReceived ? 'RECEIVED' : 'PARTIAL_RECEIVED',
            receivedDate: allReceived ? new Date() : undefined
        }
    });
}

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's sales
    const todaySales = await prisma.shopInvoice.aggregate({
        where: {
            tenantId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: { gte: today }
        },
        _sum: { total: true },
        _count: true
    });

    // Month sales
    const monthSales = await prisma.shopInvoice.aggregate({
        where: {
            tenantId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: { gte: monthStart }
        },
        _sum: { total: true },
        _count: true
    });

    // Low stock count - using raw query to compare columns
    const lowStockResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "Product" 
        WHERE "tenantId" = ${tenantId} 
        AND "isActive" = true 
        AND "stockQty" <= "minStockQty"
    ` as { count: bigint }[];
    const lowStockCount = Number(lowStockResult[0]?.count || 0);

    // Pending reorders
    const pendingReorders = await prisma.shopReorderSuggestion.count({
        where: { tenantId, status: 'PENDING' }
    });

    // Active customers (purchased in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeCustomers = await prisma.shopCustomer.count({
        where: {
            tenantId,
            status: 'ACTIVE',
            invoices: {
                some: { createdAt: { gte: thirtyDaysAgo } }
            }
        }
    });

    // Active promotions
    const activePromotions = await prisma.shopPromotion.count({
        where: {
            tenantId,
            isActive: true,
            startDate: { lte: new Date() },
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
        }
    });

    const todayTotal = Number(todaySales._sum.total || 0);
    const todayCount = todaySales._count || 0;

    return {
        todaySales: {
            total: todayTotal,
            count: todayCount,
            avgTicket: todayCount > 0 ? todayTotal / todayCount : 0
        },
        monthSales: {
            total: Number(monthSales._sum.total || 0),
            count: monthSales._count || 0
        },
        lowStockCount,
        pendingReorders,
        activeCustomers,
        activePromotions
    };
}

export async function getSalesSummary(tenantId: string, dateRange: DateRange): Promise<SalesSummary> {
    const invoices = await prisma.shopInvoice.findMany({
        where: {
            tenantId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            createdAt: { gte: dateRange.from, lte: dateRange.to }
        },
        include: { items: true }
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const productSales: Record<string, { productId: string; productName: string; quantity: number; revenue: number }> = {};
    const dailySales: Record<string, { revenue: number; transactions: number }> = {};

    for (const invoice of invoices) {
        totalRevenue += Number(invoice.total);

        const dateKey = invoice.createdAt.toISOString().split('T')[0];
        if (!dailySales[dateKey]) dailySales[dateKey] = { revenue: 0, transactions: 0 };
        dailySales[dateKey].revenue += Number(invoice.total);
        dailySales[dateKey].transactions += 1;

        for (const item of invoice.items) {
            totalCost += Number(item.costPrice) * Number(item.quantity);

            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    productId: item.productId,
                    productName: item.productName,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.productId].quantity += Number(item.quantity);
            productSales[item.productId].revenue += Number(item.lineTotal);
        }
    }

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    const salesByDay = Object.entries(dailySales)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalRevenue,
        totalCost,
        grossProfit: totalRevenue - totalCost,
        totalTransactions: invoices.length,
        avgTicketSize: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        topProducts,
        salesByDay
    };
}

export async function getLowStockProducts(tenantId: string) {
    return (prisma as any).sparePart.findMany({
        where: {
            tenantId,
            isActive: true,
            stockQty: { lte: (prisma as any).sparePart.fields.minStockQty }
        },
        orderBy: { stockQty: 'asc' },
        take: 20
    });
}

export async function getRecentTransactions(tenantId: string, limit = 10) {
    return prisma.shopInvoice.findMany({
        where: {
            tenantId,
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
            customer: { select: { name: true } },
            _count: { select: { items: true } }
        }
    });
}

// ============================================================================
// QUANTITY PROMOTIONS - Tiered Discounts (SparePromotion model)
// ============================================================================

export async function getQuantityPromotions(tenantId: string, options?: {
    active?: boolean;
    type?: string;
}) {
    const where: any = { tenantId };

    if (options?.active !== undefined) where.isActive = options.active;
    if (options?.type) where.type = options.type;

    return (prisma as any).sparePromotion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            tiers: { orderBy: { minQuantity: 'asc' } },
            _count: { select: { tiers: true } }
        }
    });
}

export async function getQuantityPromotionById(id: string, tenantId: string) {
    return (prisma as any).sparePromotion.findFirst({
        where: { id, tenantId },
        include: {
            tiers: { orderBy: { minQuantity: 'asc' } }
        }
    });
}

export async function createQuantityPromotion(data: {
    tenantId: string;
    name: string;
    description?: string;
    code?: string;
    type: string;
    discountType: string;
    discountValue?: number;
    targetScope?: string;
    targetProducts?: string[];
    targetCategories?: string[];
    minimumPurchase?: number;
    maximumDiscount?: number;
    startDate?: Date;
    endDate?: Date;
    usageLimit?: number;
    stackable?: boolean;
    tiers?: Array<{
        minQuantity: number;
        maxQuantity?: number;
        discountType: string;
        discountValue: number;
    }>;
}) {
    const { tiers, ...promotionData } = data;

    return (prisma as any).sparePromotion.create({
        data: {
            ...promotionData,
            discountValue: promotionData.discountValue || 0,
            tiers: tiers ? {
                create: tiers.map((tier: any) => ({
                    minQuantity: tier.minQuantity,
                    maxQuantity: tier.maxQuantity,
                    discountType: tier.discountType,
                    discountValue: tier.discountValue
                }))
            } : undefined
        },
        include: { tiers: true }
    });
}

export async function updateQuantityPromotion(id: string, tenantId: string, data: {
    name?: string;
    description?: string;
    code?: string;
    type?: string;
    discountType?: string;
    discountValue?: number;
    targetScope?: string;
    targetProducts?: string[];
    targetCategories?: string[];
    minimumPurchase?: number;
    maximumDiscount?: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    usageLimit?: number;
    stackable?: boolean;
    tiers?: Array<{
        minQuantity: number;
        maxQuantity?: number;
        discountType: string;
        discountValue: number;
    }>;
}) {
    const { tiers, ...promotionData } = data;

    // Delete existing tiers if new ones provided
    if (tiers) {
        await (prisma as any).sparePromotionTier.deleteMany({
            where: { promotionId: id }
        });
    }

    return (prisma as any).sparePromotion.update({
        where: { id },
        data: {
            ...promotionData,
            tiers: tiers ? {
                create: tiers.map((tier: any) => ({
                    minQuantity: tier.minQuantity,
                    maxQuantity: tier.maxQuantity,
                    discountType: tier.discountType,
                    discountValue: tier.discountValue
                }))
            } : undefined
        },
        include: { tiers: true }
    });
}

/**
 * Calculate quantity discount for a specific product
 * 
 * @param tenantId Tenant ID
 * @param productId Product ID
 * @param productCategory Product category
 * @param quantity Quantity being purchased
 * @returns Discount info or null if no applicable discount
 */
export async function calculateQuantityDiscount(
    tenantId: string,
    productId: string,
    productCategory: string | null,
    quantity: number
): Promise<{
    promotionId: string;
    promotionName: string;
    discountType: string;
    discountValue: number;
    tierId: string;
} | null> {
    // Find active QUANTITY promotions
    const now = new Date();

    const promotions = await (prisma as any).sparePromotion.findMany({
        where: {
            tenantId,
            type: 'QUANTITY',
            isActive: true,
            startDate: { lte: now },
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        },
        include: {
            tiers: { orderBy: { minQuantity: 'desc' } } // Highest tier first
        }
    });

    for (const promo of promotions) {
        // Check if product is targeted
        let isTargeted = false;

        if (promo.targetScope === 'ALL') {
            isTargeted = true;
        } else if (promo.targetScope === 'PRODUCT' && promo.targetProducts.includes(productId)) {
            isTargeted = true;
        } else if (promo.targetScope === 'CATEGORY' && productCategory && promo.targetCategories.includes(productCategory)) {
            isTargeted = true;
        }

        if (!isTargeted) continue;

        // Find matching tier (highest applicable)
        for (const tier of promo.tiers) {
            if (quantity >= tier.minQuantity) {
                if (tier.maxQuantity === null || quantity <= tier.maxQuantity) {
                    return {
                        promotionId: promo.id,
                        promotionName: promo.name,
                        discountType: tier.discountType,
                        discountValue: Number(tier.discountValue),
                        tierId: tier.id
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Get quantity discount tiers for a product (for display on product page)
 */
export async function getProductQuantityDiscounts(
    tenantId: string,
    productId: string,
    productCategory: string | null
): Promise<Array<{
    promotionName: string;
    minQuantity: number;
    maxQuantity: number | null;
    discountType: string;
    discountValue: number;
}>> {
    const now = new Date();

    const promotions = await (prisma as any).sparePromotion.findMany({
        where: {
            tenantId,
            type: 'QUANTITY',
            isActive: true,
            startDate: { lte: now },
            OR: [
                { endDate: null },
                { endDate: { gte: now } }
            ]
        },
        include: {
            tiers: { orderBy: { minQuantity: 'asc' } }
        }
    });

    const result: Array<{
        promotionName: string;
        minQuantity: number;
        maxQuantity: number | null;
        discountType: string;
        discountValue: number;
    }> = [];

    for (const promo of promotions) {
        // Check if product is targeted
        let isTargeted = false;

        if (promo.targetScope === 'ALL') {
            isTargeted = true;
        } else if (promo.targetScope === 'PRODUCT' && promo.targetProducts.includes(productId)) {
            isTargeted = true;
        } else if (promo.targetScope === 'CATEGORY' && productCategory && promo.targetCategories.includes(productCategory)) {
            isTargeted = true;
        }

        if (!isTargeted) continue;

        for (const tier of promo.tiers) {
            result.push({
                promotionName: promo.name,
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                discountType: tier.discountType,
                discountValue: Number(tier.discountValue)
            });
        }
    }

    return result;
}
