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

    // Solo puede validarse si está en PAYMENT_REVIEW
    if (order.status !== 'PAYMENT_REVIEW') {
      return NextResponse.json(
        {
          error: `Pedido no puede ser validado desde estado ${order.status}. Debe estar en PAYMENT_REVIEW.`,
        },
        { status: 400 }
      );
    }

    // Admin valida → PAID
    const updatedOrder = await db.order.updateStatus(code, 'PAID');

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error validating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate order' },
      { status: 500 }
    );
  }
}
