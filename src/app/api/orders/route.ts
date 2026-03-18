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
    const contentType = request.headers.get('content-type') || '';
    let name, email, phone, items, total, comprobante, comprobanteMime;

    // Intentar parsear como FormData primero (si contiene multipart)
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        name = formData.get('customerName') as string;
        email = formData.get('customerEmail') as string;
        phone = formData.get('customerPhone') as string;
        
        const itemsStr = formData.get('items') as string;
        items = itemsStr ? JSON.parse(itemsStr) : [];
        
        const totalStr = formData.get('total') as string;
        total = totalStr ? parseInt(totalStr, 10) : 0;

        // Procesar archivo si existe (OPCIONAL)
        const file = formData.get('comprobante') as File | null;
        if (file && file.size > 0) {
          const buffer = await file.arrayBuffer();
          // Convertir buffer a base64 de forma segura
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          comprobante = btoa(binary);
          comprobanteMime = file.type;
        }
      } catch (formError) {
        console.error('Error parsing FormData:', formError);
        throw formError;
      }
    } else {
      // Parsear como JSON
      try {
        const body = await request.json();
        name = body.name;
        email = body.email;
        phone = body.phone;
        items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
        total = typeof body.total === 'string' ? parseInt(body.total, 10) : body.total;
        comprobante = body.comprobante;
        comprobanteMime = body.comprobanteMime;
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error('Invalid request format. Expected JSON or FormData');
      }
    }

    // Validation
    if (!name || !email || !phone || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items must be a non-empty array' },
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
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
        price: typeof item.price === 'string' ? parseInt(item.price, 10) : item.price,
      })),
      total,
      status: comprobante ? 'PAYMENT_REVIEW' : 'PENDING_PAYMENT',
      comprobante: comprobante || undefined,
      comprobanteMime: comprobanteMime || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const createdOrder = await db.order.create(order);
    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
