import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendComprobanteToCustomer } from '@/lib/email';

/**
 * POST /api/orders/[code]/send-comprobante-email
 * Envía el comprobante al cliente por email (por solicitud del usuario)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    // Obtener la orden
    const order = await db.order.findUnique(code);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validar que tenga comprobante
    if (!order.comprobante || !order.comprobanteMime) {
      return NextResponse.json(
        { error: 'No comprobante available for this order' },
        { status: 400 }
      );
    }

    // Enviar email con el comprobante
    const emailResult = await sendComprobanteToCustomer(
      order.code,
      order.customerEmail,
      order.customerName,
      order.comprobanteMime
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Comprobante enviado a ${order.customerEmail}`,
    });
  } catch (error) {
    console.error('Error sending comprobante email:', error);
    return NextResponse.json(
      { error: 'Failed to send comprobante email' },
      { status: 500 }
    );
  }
}
