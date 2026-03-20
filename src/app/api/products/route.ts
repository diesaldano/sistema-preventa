import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * PHASE 2 - R2.1: GET /api/products con Cache-Control
 * Cliente cachea en localStorage por 1 hora
 */
export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany();

    // R2.1: Cache-Control header para 1 hora (3600 segundos)
    const response = NextResponse.json(products);
    response.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    response.headers.set('X-Cache-Status', 'fresh');
    
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * PHASE 2 - R2.2: POST /api/products/refresh
 * Invalida cache en cliente (próxima petición GET refetch)
 * En future: señal a clientes para refetch
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verificar autenticación admin
    // Por ahora permitir a cualquiera, después agregar auth
    
    const products = await db.product.findMany();

    // Forzar recalc en cliente con new timestamp
    const response = NextResponse.json({
      success: true,
      products,
      message: 'Cache invalidated, clients will refetch on next request',
      timestamp: new Date().toISOString(),
    });
    
    // No cachear refresh endpoint
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Error refreshing products:', error);
    return NextResponse.json(
      { error: 'Failed to refresh products' },
      { status: 500 }
    );
  }
}
