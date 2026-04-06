import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  console.log(`[GET /api/orders/[${code}]] ========================================`);
  console.log(`[GET /api/orders/[${code}]] Loading order code: ${code}`);
  
  try {
    console.log(`[GET /api/orders/[${code}]] Calling db.order.findUnique()`);
    const order = await db.order.findUnique(code);

    if (!order) {
      console.warn(`[GET /api/orders/[${code}]] ⚠️  Order NOT FOUND in database`);
      return NextResponse.json(
        { 
          error: 'Order not found',
          code: code,
          debug: {
            searched: code,
            result: 'NOT_FOUND'
          }
        },
        { status: 404 }
      );
    }

    console.log(`[GET /api/orders/[${code}]] ✅ Order FOUND: status=${order.status}, items=${order.items?.length || 0}`);
    
    return NextResponse.json({
      ...order,
      debug: {
        timestamp: new Date().toISOString(),
        source: 'db.order.findUnique()',
        hasComprobante: !!order.comprobante,
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`[GET /api/orders/[${code}]] ❌ CRITICAL ERROR:`, errorMsg);
    console.error(`[GET /api/orders/[${code}]] Stack:`, errorStack);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch order',
        code: code,
        details: errorMsg,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
