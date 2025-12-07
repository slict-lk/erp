// Point of Sale Module API Functions
import { prisma } from '@/lib/prisma';
import type { POSSession, POSOrder, POSConfig } from './types';

const client = prisma as any;

// POS Configuration
export async function getPOSConfigs(tenantId: string) {
  return await client.pOSConfig.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function createPOSConfig(data: Partial<POSConfig> & { tenantId: string }) {
  return {
    id: `pos_config_${Date.now()}`,
    name: data.name!,
    warehouseId: data.warehouseId!,
    allowDiscount: data.allowDiscount !== false,
    maxDiscount: data.maxDiscount,
  };
}

// POS Sessions
export async function getPOSSessions(tenantId: string, status?: 'OPEN' | 'CLOSED') {
  return await client.pOSSession.findMany({
    where: {
      tenantId,
      ...(status && { status }),
    },
    include: {
      config: true,
      user: true,
    },
    orderBy: { startDate: 'desc' },
  });
}

export async function getCurrentSession(tenantId: string, userId: string) {
  return await client.pOSSession.findFirst({
    where: {
      tenantId,
      userId,
      status: 'OPEN',
    },
    include: {
      config: true,
    },
  });
}

export async function openPOSSession(data: {
  posConfigId: string;
  userId: string;
  openingCash: number;
  tenantId: string;
}) {
  return await client.pOSSession.create({
    data: {
      name: `Session ${new Date().toLocaleDateString()}`,
      posConfigId: data.posConfigId,
      userId: data.userId,
      startDate: new Date(),
      openingCash: data.openingCash,
      status: 'OPEN',
      tenantId: data.tenantId,
    },
    include: {
      config: true,
      user: true,
    },
  });
}

export async function closePOSSession(
  sessionId: string,
  closingCash: number,
  tenantId: string
) {
  return {
    sessionId,
    closingCash,
    expectedCash: 0,
    difference: 0,
    totalSales: 0,
    orderCount: 0,
  };
}

// POS Orders
export async function getPOSOrders(tenantId: string, sessionId?: string) {
  return await client.pOSOrder.findMany({
    where: {
      tenantId,
      ...(sessionId && { sessionId }),
    },
    include: {
      session: true,
      customer: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPOSOrder(data: Partial<POSOrder> & { tenantId: string }) {
  const total = data.total || 0;
  
  return await client.pOSOrder.create({
    data: {
      reference: data.reference || `POS-${Date.now()}`,
      sessionId: data.sessionId!,
      customerId: data.customerId,
      subtotal: data.subtotal || total,
      tax: data.tax || 0,
      discount: data.discount || 0,
      total,
      paymentMethod: data.paymentMethod || 'CASH',
      status: 'PAID',
      tenantId: data.tenantId,
    },
    include: {
      session: true,
      customer: true,
    },
  });
}

// Cash Register
export async function getCashRegisterReport(sessionId: string, tenantId: string) {
  return await client.pOSSession.findFirst({
    where: {
      id: sessionId,
      tenantId,
    },
    include: {
      orders: true,
    },
  }).then((session: any) => {
    if (!session) {
      return {
        sessionId,
        openingBalance: 0,
        sales: 0,
        returns: 0,
        expenses: 0,
        expectedBalance: 0,
        actualBalance: 0,
        difference: 0,
        orderCount: 0,
        avgOrderValue: 0,
      };
    }

    const openingBalance = session.openingCash;
    const sales = session.orders.reduce((acc: number, order: any) => acc + order.total, 0);
    const returns = 0;
    const expenses = 0;
    const expectedBalance = openingBalance + sales - returns - expenses;
    const actualBalance = session.closingCash || 0;
    const difference = actualBalance - expectedBalance;
    const orderCount = session.orders.length;
    const avgOrderValue = orderCount > 0 ? sales / orderCount : 0;

    return {
      sessionId,
      openingBalance,
      sales,
      returns,
      expenses,
      expectedBalance,
      actualBalance,
      difference,
      orderCount,
      avgOrderValue,
    };
  });
}

// POS Analytics
export async function getPOSAnalytics(tenantId: string, startDate: Date, endDate: Date) {
  return {
    totalSales: 0,
    orderCount: 0,
    avgOrderValue: 0,
    topProducts: [],
    hourlyBreakdown: [],
    paymentMethodBreakdown: [],
  };
}

// Receipt Generation
export async function generateReceipt(orderId: string, tenantId: string) {
  return {
    orderId,
    receiptNumber: `RCP-${Date.now()}`,
    html: '<div>Receipt HTML</div>',
    printData: {},
  };
}
