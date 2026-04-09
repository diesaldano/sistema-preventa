import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPaymentRejectedToUser } from '@/lib/email';
import { verifyAccessToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity-log';

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

    // Log activity
    const token = request.cookies.get('accessToken')?.value;
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        const adminUser = await db.user.findById(payload.userId);
        await logActivity(payload.userId, adminUser?.email || 'unknown', 'order_reject', code, `${order.status} → CANCELLED`);
      }
    }

    // 📧 Notificar al usuario que su pago fue rechazado
    await sendPaymentRejectedToUser(
      code,
      updatedOrder.customerEmail,
      updatedOrder.customerName
    );

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error rejecting order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject order' },
      { status: 500 }
    );
  }
}
