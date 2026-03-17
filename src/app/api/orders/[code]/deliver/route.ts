import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const order = await db.order.findUnique(code);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Solo puede redeemirse si está en PAID
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

    return NextResponse.json({
      ...updatedOrder,
      message: '✓ Pedido retirado exitosamente. REDEEMED (final)',
    });
  } catch (error) {
    // Si es error de REDEEMED, dar mensaje especial
    if (error instanceof Error && error.message.includes('REDEEMED')) {
      return NextResponse.json(
        { error: '⚠️ Este pedido ya fue entregado.' },
        { status: 400 }
      );
    }

    console.error('Error redeeming order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to redeem order' },
      { status: 500 }
    );
  }
}
