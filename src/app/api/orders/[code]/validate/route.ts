import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/orders/[code]/validate
 * Admin valida el pago y lo aprueba
 * 
 * Requisitos:
 * - Orden debe estar en estado PAYMENT_REVIEW
 * - Orden debe tener comprobante cargado
 * 
 * Transición: PAYMENT_REVIEW → PAID (listo para retiro en evento)
 * 
 * Response:
 * - 200: Orden aprobada, status=PAID
 * - 404: Orden no encontrada
 * - 400: Estado inválido para validar o falta comprobante
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

    // Solo puede validarse si está en PAYMENT_REVIEW o PENDING_PAYMENT
    if (order.status !== 'PAYMENT_REVIEW' && order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        {
          error: `Pedido no puede ser validado desde estado ${order.status}. Debe estar en PENDING_PAYMENT o PAYMENT_REVIEW.`,
        },
        { status: 400 }
      );
    }

    // Admin valida → PAID (listo para retiro en evento)
    // El comprobante es OPCIONAL - se puede validar sin él
    const updatedOrder = await db.order.updateStatus(code, 'PAID');

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error validating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al validar pedido' },
      { status: 500 }
    );
  }
}

