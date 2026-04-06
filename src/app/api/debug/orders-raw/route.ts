/**
 * DEBUG ENDPOINT - ULTRA SIMPLE
 * Conectar directamente a Prisma sin abstracción
 * Para verificar que la conexión a BD funciona
 * GET /api/debug/orders-raw
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Solo en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('[DEBUG] orders-raw: Connecting to Prisma...');
    
    // Conectar y probar
    const orderCount = await prisma.order.count();
    console.log(`[DEBUG] orders-raw: Total orders in DB: ${orderCount}`);
    
    // Traer todas las órdenes sin procesar
    const rawOrders = await prisma.order.findMany({
      select: {
        code: true,
        customerName: true,
        customerEmail: true,
        status: true,
        total: true,
        comprobante: false, // No traer el base64 (muy pesado)
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Límite para no sobrecargar
    });

    console.log(`[DEBUG] orders-raw: Returned ${rawOrders.length} orders`);

    return NextResponse.json({
      success: true,
      totalInDb: orderCount,
      returnedCount: rawOrders.length,
      orders: rawOrders,
      database: {
        provider: process.env.DATABASE_URL?.split('?')[0]?.substring(0, 12) || 'unknown',
        connected: true,
      }
    });
  } catch (error) {
    console.error('[DEBUG] orders-raw: CRITICAL ERROR', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        hint: 'Check if DATABASE_URL is correct and Supabase is accessible'
      },
      { status: 500 }
    );
  }
}
