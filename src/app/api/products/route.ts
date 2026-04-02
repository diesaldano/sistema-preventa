import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cacheOrLoad, getCacheStats, invalidateCache } from '@/lib/server-cache';

/**
 * PHASE 2 - R2.1: GET /api/products con Server-side Cache
 * 
 * 1. Intenta obtener desde memory cache (muy rápido)
 * 2. Si expiró → query BD y cachea para próximas solicitudes
 * 3. Retorna con headers para que cliente también cachee
 */
export async function GET(request: NextRequest) {
  try {
    // Usar cache con fallback a BD
    const products = await cacheOrLoad(
      'products:all',
      () => db.product.findMany(),
      3600000 // 1 hora
    );

    // Headers para cache del cliente también
    const response = NextResponse.json(products);
    response.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    response.headers.set('X-Cache-Status', 'fresh');
    
    // Debug: incluir stats en desarrollo
    if (process.env.NODE_ENV === 'development') {
      const stats = getCacheStats();
      response.headers.set('X-Cache-Entries', stats.entriesCount.toString());
    }
    
    return response;
  } catch (error) {
    console.error('[Products] Error fetching:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * PHASE 2 - R2.2: POST /api/products/refresh
 * Invalida cache en servidor (admin solo)
 * Clientes se actualizan en próximo GET
 * 
 * TODO: Verificar que usuario es admin
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Verificar autenticación admin (PHASE 4)
    // Por ahora permitir a cualquiera, después agregar auth
    
    // Invalidar cache del servidor
    invalidateCache('products:all');
    
    // Obtener nuevos datos desde BD
    const products = await db.product.findMany();

    // Respuesta con nuevos datos
    const response = NextResponse.json({
      success: true,
      products,
      message: 'Server cache invalidated. Clients will refetch on next request.',
      timestamp: new Date().toISOString(),
      cacheStats: getCacheStats(),
    });
    
    // No cachear este endpoint
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('[Products Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh products' },
      { status: 500 }
    );
  }
}
