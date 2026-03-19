import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/orders/[code]/deliver
 * Staff en evento marca el pedido como entregado/redeemed
 * 
 * Requisitos:
 * - Orden debe estar en estado PAID
 * 
 * Transición: PAID → REDEEMED (FINAL - no se puede cambiar después)
 * 
 * Response:
 * - 200: Orden entregada, status=REDEEMED (final)
 * - 404: Orden no encontrada
 * - 400: Estado inválido o ya fue entregada
 * - 500: Error del servidor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const order = await db.order.findUnique(code);

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya fue entregada (REDEEMED es estado FINAL)
    if (order.status === 'REDEEMED') {
      return NextResponse.json(
        {
          error: '⚠️ Este pedido ya fue entregado. No se puede procesar nuevamente.',
        },
        { status: 400 }
      );
    }

    // Solo puede entregarse si está en PAID
    if (order.status !== 'PAID') {
      return NextResponse.json(
        {
          error: `Pedido debe estar en estado PAID para retirar. Estado actual: ${order.status}`,
        },
        { status: 400 }
      );
    }

    // Staff entrega → REDEEMED (FINAL)
    const updatedOrder = await db.order.updateStatus(code, 'REDEEMED');

    return NextResponse.json(updatedOrder);
  } catch (error) {
    // Si es error de REDEEMED, dar mensaje especial
    if (error instanceof Error && error.message.includes('REDEEMED')) {
      return NextResponse.json(
        { error: '⚠️ Este pedido ya fue entregado.' },
        { status: 400 }
      );
    }

    console.error('Error delivering order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al entregar pedido' },
      { status: 500 }
    );
  }
}
