/**
 * TIER 2: Inventory Management API
 * GET  /api/admin/inventory - List all products with stock info and low stock alerts
 * PUT  /api/admin/inventory - Adjust stock for a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        stock: true,
        available: true,
        sizes: true,
        updatedAt: true,
      },
    });

    const lowStock = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD && p.available);
    const outOfStock = products.filter((p) => p.stock <= 0 && p.available);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const categories = [...new Set(products.map((p) => p.category))];

    return NextResponse.json({
      success: true,
      data: {
        products,
        summary: {
          totalProducts: products.length,
          totalStock,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          lowStockThreshold: LOW_STOCK_THRESHOLD,
          categories,
        },
        alerts: lowStock.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          category: p.category,
          level: p.stock <= 0 ? 'out_of_stock' : 'low_stock',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cargar inventario' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, adjustment, reason } = body;

    if (!productId || adjustment === undefined || adjustment === null) {
      return NextResponse.json(
        { success: false, error: 'productId y adjustment son requeridos' },
        { status: 400 }
      );
    }

    const adjustmentNum = parseInt(adjustment);
    if (isNaN(adjustmentNum)) {
      return NextResponse.json(
        { success: false, error: 'adjustment debe ser un número' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    const newStock = product.stock + adjustmentNum;
    if (newStock < 0) {
      return NextResponse.json(
        { success: false, error: `Stock resultante sería negativo (${newStock}). Stock actual: ${product.stock}` },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
      select: {
        id: true,
        name: true,
        stock: true,
        category: true,
        available: true,
      },
    });

    // Log activity
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const adminUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });
        const sign = adjustmentNum >= 0 ? '+' : '';
        await logActivity(
          payload.userId,
          adminUser?.email || 'unknown',
          'stock_adjust',
          productId,
          `${product.name}: ${product.stock} → ${newStock} (${sign}${adjustmentNum})${reason ? ` - ${reason}` : ''}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      previousStock: product.stock,
      newStock,
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { success: false, error: 'Error al ajustar stock' },
      { status: 500 }
    );
  }
}
