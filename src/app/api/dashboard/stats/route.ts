import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultTenant } from '@/lib/get-tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let tenantId = searchParams.get('tenantId');

    // If no tenantId provided, get or create default tenant
    if (!tenantId || tenantId === 'demo-tenant-id') {
      const tenant = await getOrCreateDefaultTenant();
      tenantId = tenant.id;
    }

    // Get total revenue from POS orders
    const revenueResult = await prisma.pOSOrder.aggregate({
      where: { tenantId, status: 'PAID' },
      _sum: { total: true },
    });

    // Get customer count
    const customerCount = await prisma.customer.count({
      where: { tenantId },
    });

    // Get order count
    const orderCount = await prisma.pOSOrder.count({
      where: { tenantId },
    });

    // Get product count
    const productCount = await prisma.product.count({
      where: { tenantId },
    });

    // Get recent orders
    const recentOrders = await prisma.pOSOrder.findMany({
      where: { tenantId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Get manufacturing stats
    const manufacturingOrders = await prisma.manufacturingOrder.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    return NextResponse.json({
      stats: {
        totalRevenue: revenueResult._sum.total || 0,
        customerCount,
        orderCount,
        productCount,
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        amount: order.total,
        status: order.status,
      })),
      manufacturing: {
        inProgress: manufacturingOrders.find(m => m.status === 'IN_PROGRESS')?._count || 0,
        scheduled: manufacturingOrders.find(m => m.status === 'CONFIRMED')?._count || 0,
        pending: manufacturingOrders.find(m => m.status === 'DRAFT')?._count || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

