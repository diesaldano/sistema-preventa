import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/export/orders
 * Export orders to CSV with filters:
 * - dateFrom / dateTo (ISO date strings)
 * - status (OrderStatus or "ALL")
 * - customer (search by name or email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, status, customer } = body;

    // Build Prisma where clause
    const where: Record<string, unknown> = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = end;
      }
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (customer && customer.trim()) {
      const search = customer.trim();
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build CSV
    const headers = [
      'Código',
      'Cliente',
      'Email',
      'Teléfono',
      'Total',
      'Estado',
      'Productos',
      'Cantidades',
      'Fecha Creación',
      'Última Actualización',
    ];

    const rows = orders.map((order) => {
      const products = order.items
        .map((item) => item.product?.name || item.productId)
        .join('; ');
      const quantities = order.items
        .map((item) => `${item.product?.name || item.productId}: ${item.quantity}`)
        .join('; ');

      return [
        order.code,
        `"${order.customerName.replace(/"/g, '""')}"`,
        order.customerEmail,
        order.customerPhone,
        order.total,
        order.status,
        `"${products.replace(/"/g, '""')}"`,
        `"${quantities.replace(/"/g, '""')}"`,
        new Date(order.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
        new Date(order.updatedAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      ].join(',');
    });

    // BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pedidos-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al exportar pedidos' },
      { status: 500 }
    );
  }
}
