import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOrderCode, isValidEmail, isValidPhone } from '@/lib/utils';
import { Order } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const orders = await db.order.findMany();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, items, total } = body;

    // Validation
    if (!name || !email || !phone || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const code = generateOrderCode();
    const now = new Date();
    const order: Order = {
      code,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      items,
      total,
      status: 'PENDING_PAYMENT',
      createdAt: now,
      updatedAt: now,
    };

    const createdOrder = await db.order.create(order);
    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
