/**
 * ULTRA DEBUG - Conectar 100% directo a Prisma
 * Sin abstracción db.order, solo Prisma raw
 * GET /api/debug/orders-prisma-direct
 * 
 * SI ESTO FALLA: Problema es con la conexión a BD o Prisma
 * SI ESTO ANDA: Problema está en db.order abstracción
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  console.log('[ULTRA-DEBUG] ================================================');
  console.log('[ULTRA-DEBUG] Starting DIRECT Prisma query');
  console.log('[ULTRA-DEBUG] Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');

  try {
    console.log('[ULTRA-DEBUG] Attempting Prisma.order.count()...');
    const totalCount = await prisma.order.count();
    console.log(`[ULTRA-DEBUG] ✅ Total orders in DB: ${totalCount}`);

    console.log('[ULTRA-DEBUG] Attempting Prisma.order.findMany()...');
    const allOrders = await prisma.order.findMany({
      select: {
        code: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        status: true,
        total: true,
        comprobante: false,
        comprobanteMime: false,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            size: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    console.log(`[ULTRA-DEBUG] ✅ Retrieved ${allOrders.length} orders from Prisma`);
    
    if (allOrders.length > 0) {
      console.log('[ULTRA-DEBUG] First order:', {
        code: allOrders[0].code,
        status: allOrders[0].status,
        itemsCount: allOrders[0].items?.length || 0,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'Prisma.order findMany() - DIRECT',
      totalInDatabase: totalCount,
      returnedCount: allOrders.length,
      orders: allOrders,
      connectionTest: {
        prismaConnected: true,
        timestamp: new Date().toISOString(),
      },
      debug: {
        note: 'This is using DIRECT Prisma without db.order abstraction',
        if_this_works: 'Problem is in db.order.findMany() abstraction',
        if_this_fails: 'Problem is with Prisma/Database connection',
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[ULTRA-DEBUG] ❌ DIRECT PRISMA FAILED:', errorMsg);
    console.error('[ULTRA-DEBUG] Stack:', errorStack);

    return NextResponse.json(
      {
        success: false,
        source: 'Prisma.order findMany() - DIRECT',
        error: errorMsg,
        stack: errorStack,
        debug: {
          note: 'Direct Prisma query failed - this means Database/Connection problem',
          checkDatabaseUrl: 'Verify DATABASE_URL is correct',
          checkSupabaseStatus: 'Check if Supabase is online',
        }
      },
      { status: 500 }
    );
  }
}
