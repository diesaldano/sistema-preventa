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

    // No puede rechazarse si ya está en REDEEMED o CANCELLED
    if (order.status === 'REDEEMED' || order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Pedido con estado ${order.status} no puede ser rechazado.` },
        { status: 400 }
      );
    }

    const updatedOrder = await db.order.updateStatus(code, 'CANCELLED');
    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error rejecting order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject order' },
      { status: 500 }
    );
  }
}
