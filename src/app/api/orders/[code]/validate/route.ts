import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPaymentConfirmedToUser } from '@/lib/email';

/**
 * POST /api/orders/[code]/validate
 * Admin valida el pago y lo aprueba
 * 
 * Requisitos:
 * - Orden debe estar en estado PAYMENT_REVIEW
 * - ❌ IMPORTANTE: Orden DEBE tener comprobante cargado (obligatorio)
 * 
 * Transición: PAYMENT_REVIEW → PAID (listo para retiro en evento)
 * 
 * Response:
 * - 200: Orden aprobada, status=PAID
 * - 404: Orden no encontrada
 * - 400: Estado inválido, falta comprobante, o usuario intenta desde PENDING_PAYMENT
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

    // ✅ FLEXIBLE: Aceptar tanto PENDING_PAYMENT como PAYMENT_REVIEW
    // - Sin comprobante: cambiar PENDING_PAYMENT → PAID (dev/testing)
    // - Con comprobante: cambiar PAYMENT_REVIEW → PAID (producción)
    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAYMENT_REVIEW') {
      return NextResponse.json(
        {
          error: `Pedido no puede ser validado desde estado ${order.status}.`,
          currentStatus: order.status,
          hint: order.status === 'PAID' 
            ? 'Ya fue validado'
            : order.status === 'REDEEMED'
            ? 'Ya fue retirado'
            : 'Estado no reconocido',
        },
        { status: 400 }
      );
    }

    // ✅ OK para validar en ambos estados
    // (sin comprobante en dev, o con comprobante en producción)

    // Admin valida → PAID (listo para retiro en evento)
    const updatedOrder = await db.order.updateStatus(code, 'PAID');

    console.log(`✅ ORDER VALIDATED: ${code} | ${order.status} → PAID`);

    // 📧 Notificar al usuario que su pago fue confirmado
    await sendPaymentConfirmedToUser(
      code,
      updatedOrder.customerEmail,
      updatedOrder.customerName
    );

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error validating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al validar pedido' },
      { status: 500 }
    );
  }
}

