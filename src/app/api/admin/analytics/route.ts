import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * PHASE 5 - Analytics API
 * Returns aggregated metrics for the admin dashboard:
 * - Total revenue (real-time, by status)
 * - Order counts by status
 * - Payment success rate
 * - Peak hours analysis
 * - Product sales ranking
 */
export async function GET() {
  try {
    // Fetch all orders with items and product info
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // --- Order counts by status ---
    const ordersByStatus = {
      PENDING_PAYMENT: 0,
      PAYMENT_REVIEW: 0,
      PAID: 0,
      REDEEMED: 0,
      CANCELLED: 0,
    };
    for (const order of orders) {
      const status = order.status as keyof typeof ordersByStatus;
      if (status in ordersByStatus) {
        ordersByStatus[status]++;
      }
    }

    // --- Revenue metrics ---
    const confirmedStatuses = ['PAID', 'REDEEMED'];
    const confirmedOrders = orders.filter((o) => confirmedStatuses.includes(o.status));
    const totalRevenueConfirmed = confirmedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenuePending = orders
      .filter((o) => o.status === 'PENDING_PAYMENT' || o.status === 'PAYMENT_REVIEW')
      .reduce((sum, o) => sum + o.total, 0);
    const totalRevenueAll = orders.reduce((sum, o) => sum + o.total, 0);

    // --- Payment success rate ---
    const resolvedOrders = orders.filter((o) =>
      ['PAID', 'REDEEMED', 'CANCELLED'].includes(o.status)
    );
    const successfulPayments = orders.filter((o) =>
      confirmedStatuses.includes(o.status)
    ).length;
    const paymentSuccessRate =
      resolvedOrders.length > 0
        ? Math.round((successfulPayments / resolvedOrders.length) * 100)
        : 0;

    // --- Peak hours analysis ---
    const hourCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourCounts[h] = 0;
    for (const order of orders) {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    }
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);

    // --- Product sales ranking ---
    const productSalesMap: Record<
      string,
      { productId: string; name: string; category: string; totalQuantity: number; totalRevenue: number }
    > = {};

    for (const order of orders) {
      // Only count confirmed orders for sales ranking
      if (!confirmedStatuses.includes(order.status) && order.status !== 'PAYMENT_REVIEW' && order.status !== 'PENDING_PAYMENT') continue;
      for (const item of order.items) {
        const key = item.productId;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            productId: item.productId,
            name: item.product?.name || 'Producto eliminado',
            category: item.product?.category || 'Sin categoría',
            totalQuantity: 0,
            totalRevenue: 0,
          };
        }
        productSalesMap[key].totalQuantity += item.quantity;
        productSalesMap[key].totalRevenue += item.price * item.quantity;
      }
    }

    const productRanking = Object.values(productSalesMap).sort(
      (a, b) => b.totalRevenue - a.totalRevenue
    );

    // --- Recent orders (last 10) ---
    const recentOrders = orders.slice(0, 10).map((o) => ({
      code: o.code,
      customerName: o.customerName,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    }));

    // --- Daily revenue (last 7 days) ---
    const dailyRevenue: Record<string, { date: string; revenue: number; orders: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyRevenue[key] = { date: key, revenue: 0, orders: 0 };
    }
    for (const order of orders) {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (dailyRevenue[dateKey]) {
        dailyRevenue[dateKey].revenue += order.total;
        dailyRevenue[dateKey].orders++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: orders.length,
        ordersByStatus,
        revenue: {
          confirmed: totalRevenueConfirmed,
          pending: totalRevenuePending,
          total: totalRevenueAll,
        },
        paymentSuccessRate,
        peakHours,
        productRanking,
        recentOrders,
        dailyRevenue: Object.values(dailyRevenue),
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}
