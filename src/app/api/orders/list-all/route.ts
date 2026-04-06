/**
 * DEBUG ENDPOINT - Solo para desarrollo
 * Listar todos los códigos de órdenes para debugging
 * GET /api/orders/list-all
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Solo en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('[DEBUG] list-all: Fetching orders from DB...');
    
    const orders = await db.order.findMany();
    
    console.log(`[DEBUG] list-all: Found ${orders.length} orders`);
    
    // Retornar info básica
    const simplified = orders.map(o => ({
      code: o.code,
      customerName: o.customerName,
      status: o.status,
      total: o.total,
      hasComprobante: !!o.comprobante,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({
      count: simplified.length,
      orders: simplified,
      debug: {
        endpoint: '/api/orders/list-all',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('[DEBUG] list-all: Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    );
  }
}
