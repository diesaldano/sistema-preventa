import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { prisma } from '@/lib/db';
import { generateOrderCode } from '@/lib/utils';
import { Order, OrderStatus } from '@/lib/types';
import { 
  validateEmail, 
  validatePhone,
  validateName,
  validateItems,
  validateComprobante,
  calculateTotalFromItems,
  verifyTotal,
  sanitizeName,
  sanitizeEmail
} from '@/lib/validators';
import { 
  checkRateLimitByIP,
  checkRateLimitByEmail,
  checkDuplicateOrder,
  logSecurityEvent
} from '@/lib/rate-limiter';
import { sendNewOrderNotificationToAdmin } from '@/lib/email';

/**
 * Extraer IP del cliente desde headers
 * Funciona en: desarrollo (localhost), producción (Vercel/proxies), Cloudflare, etc.
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;
  
  return 'unknown';
}

/**
 * Agregar headers de seguridad a la respuesta
 * Prevenir: XSS, clickjacking, MIME sniffing
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevenir XSS
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CORS - restringir a mismo origen
  response.headers.set('Access-Control-Allow-Origin', 'same-origin');
  
  // No cachear datos sensibles
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/orders] ========================================');
    console.log('[GET /api/orders] Starting fetch from db.order.findMany()');
    
    const orders = await db.order.findMany();
    
    console.log(`[GET /api/orders] ✅ SUCCESS: Found ${orders.length} orders`);
    console.log('[GET /api/orders] Sample order:', orders[0] ? { code: orders[0].code, status: orders[0].status } : 'NONE');
    
    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders,
      debug: {
        timestamp: new Date().toISOString(),
        source: 'db.order.findMany()',
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[GET /api/orders] ❌ CRITICAL ERROR:', errorMsg);
    console.error('[GET /api/orders] Stack:', errorStack);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch orders',
        details: errorMsg,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  try {
    // ============================================================
    // 1. PARSED REQUEST BODY
    // ============================================================
    
    const contentType = request.headers.get('content-type') || '';
    let customerName: string | null = null;
    let customerEmail: string | null = null;
    let customerPhone: string | null = null;
    let items: any[] = [];
    let clientTotal: number | null = null;
    // ❌ REMOVED: Comprobante NO se acepta en POST /api/orders
    // El comprobante DEBE ser subido después via POST /api/orders/[code]/upload-comprobante

    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        customerName = formData.get('customerName') as string;
        customerEmail = formData.get('customerEmail') as string;
        customerPhone = formData.get('customerPhone') as string;
        const itemsStr = formData.get('items') as string;
        items = itemsStr ? JSON.parse(itemsStr) : [];
        const totalStr = formData.get('total') as string;
        clientTotal = totalStr ? parseInt(totalStr, 10) : null;
        // ❌ REMOVED: Comprobante no se parsea aquí
      } catch (error) {
        console.error('Error parsing FormData:', error);
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
      }
    } else {
      try {
        const body = await request.json();
        customerName = body.customerName || body.name;
        customerEmail = body.customerEmail || body.email;
        customerPhone = body.customerPhone || body.phone;
        items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
        clientTotal = body.total;
        // ❌ REMOVED: Comprobante no se parsea aquí
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }
    }

    // ============================================================
    // 2. VALIDATE INPUTS - PHASE 1 SECURITY
    // ============================================================

    // Validar email
    const emailValidation = validateEmail(customerEmail);
    if (!emailValidation.valid) {
      await logSecurityEvent(clientIP, customerEmail || 'unknown', 'invalid_input', `Email: ${emailValidation.error}`);
      return NextResponse.json({ error: emailValidation.error, field: 'email' }, { status: 400 });
    }
    const normalizedEmail = sanitizeEmail(customerEmail as string);

    // Validar teléfono
    const phoneValidation = validatePhone(customerPhone);
    if (!phoneValidation.valid) {
      await logSecurityEvent(clientIP, normalizedEmail, 'invalid_input', `Phone: ${phoneValidation.error}`);
      return NextResponse.json({ error: phoneValidation.error, field: 'phone' }, { status: 400 });
    }

    // Validar nombre
    const nameValidation = validateName(customerName);
    if (!nameValidation.valid) {
      await logSecurityEvent(clientIP, normalizedEmail, 'invalid_input', `Name: ${nameValidation.error}`);
      return NextResponse.json({ error: nameValidation.error, field: 'name' }, { status: 400 });
    }
    const sanitizedName = sanitizeName(customerName as string);

    // Validar items
    const itemsValidation = await validateItems(items);
    if (!itemsValidation.valid) {
      await logSecurityEvent(clientIP, normalizedEmail, 'invalid_input', `Items: ${itemsValidation.error}`);
      return NextResponse.json({ error: itemsValidation.error, field: 'items' }, { status: 400 });
    }

    // Calcular total desde precios actuales de BD
    const serverTotal = calculateTotalFromItems(itemsValidation.validatedItems!);

    // ============================================================
    // 3. RATE LIMITING - PREVENT ABUSE
    // ============================================================

    const rateLimitIP = await checkRateLimitByIP(clientIP);
    if (!rateLimitIP.ok) {
      await logSecurityEvent(clientIP, normalizedEmail, 'rate_limit_ip', `Exceeded IP limit: ${rateLimitIP.count}/${rateLimitIP.limit}`);
      return NextResponse.json(
        { error: 'Too many requests from this IP. Try again in 1 hour.', retryAfter: 3600 },
        { status: 429 }
      );
    }

    const rateLimitEmail = await checkRateLimitByEmail(normalizedEmail);
    if (!rateLimitEmail.ok) {
      await logSecurityEvent(clientIP, normalizedEmail, 'rate_limit_email', `Exceeded email limit: ${rateLimitEmail.count}/${rateLimitEmail.limit}`);
      return NextResponse.json(
        { error: 'Too many orders from this email. Try again in 1 hour.', retryAfter: 3600 },
        { status: 429 }
      );
    }

    // ============================================================
    // 4. DEDUPLICATION - PREVENT ACCIDENTAL DOUBLE-CLICK
    // ============================================================

    const dupCheck = await checkDuplicateOrder(normalizedEmail);
    if (dupCheck.isDuplicate) {
      await logSecurityEvent(clientIP, normalizedEmail, 'duplicate', `Duplicate order within 5min window`);
      return NextResponse.json(
        { 
          error: 'You already have a recent order. Please wait 5 minutes before creating another.',
          existingOrderCode: dupCheck.existingOrder?.code,
          statusCode: 409
        },
        { status: 409 }
      );
    }

    // ============================================================
    // 5. CREATE ORDER - ATOMIC TRANSACTION
    // ============================================================

    const code = generateOrderCode();
    const now = new Date();
    // 🔄 CHANGED: Siempre PENDING_PAYMENT - Comprobante se sube después
    const status: OrderStatus = 'PENDING_PAYMENT';
    
    // ✅ ESTRUCTURA CORRECTA PARA PRISMA: items como create anidado
    const orderData = {
      code,
      customerName: sanitizedName,
      customerEmail: normalizedEmail,
      customerPhone: customerPhone!.replace(/\D/g, ''),
      items: {
        create: itemsValidation.validatedItems!.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,  // Talle seleccionado (ej: "M", "L", "XL")
        }))
      },
      total: serverTotal,
      status,
      customerIP: clientIP,
      // ❌ Comprobante NO se guarda en creación
      createdAt: now,
      updatedAt: now,
    };

    // ✅ PASO 4: TRANSACCIÓN ATÓMICA
    // Usa Prisma.$transaction() para garantizar que:
    // 1. La orden se crea efectivamente (atomicidad)
    // 2. Si hay error, NADA se guarda (rollback automático)
    // 3. Previene race conditions entre check y create
    // 4. Stock se decrementa atómicamente junto con la creación
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Segunda validación dentro de transacción (por si acaso)
      // para asegurar que no hay orden duplicada justo en este momento
      const recentOrder = await tx.order.findFirst({
        where: {
          customerEmail: normalizedEmail,
          createdAt: {
            gte: new Date(now.getTime() - 5 * 60 * 1000), // último 5 minutos
          },
        },
      });

      if (recentOrder) {
        throw new Error('DUPLICATE_ORDER_IN_TRANSACTION');
      }

      // ✅ Decrementar stock de cada producto DENTRO de la transacción
      // Esto garantiza que si la creación falla, el stock no se reduce
      for (const item of itemsValidation.validatedItems!) {
        const updated = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        // Verificar que el stock no quedó negativo (race condition protection)
        if (updated.stock < 0) {
          throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);
        }
      }

      return tx.order.create({ data: orderData });
    });
    
    console.log(`✅ ORDER CREATED (ATOMIC): ${code} | Email: ${normalizedEmail} | IP: ${clientIP} | Total: $${serverTotal}`);

    // 📧 Notificar al admin que hay un nuevo pedido para validar
    sendNewOrderNotificationToAdmin(
      code,
      sanitizedName,
      normalizedEmail,
      serverTotal
    ).catch((err) => console.error('Error sending admin notification:', err));

    const response = NextResponse.json(createdOrder, { status: 201 });
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    // ✅ PASO 4: Manejo de error de duplicado en transacción
    if (error instanceof Error && error.message === 'DUPLICATE_ORDER_IN_TRANSACTION') {
      await logSecurityEvent(
        clientIP,
        'unknown',
        'duplicate_atomic',
        'Duplicate detected within atomic transaction'
      );
      const response = NextResponse.json(
        { error: 'Duplicate order detected during processing. Please try again.' },
        { status: 409 }
      );
      return addSecurityHeaders(response);
    }

    // ✅ Manejo de error de stock insuficiente (race condition detectada en transacción)
    if (error instanceof Error && error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const productId = error.message.split(':')[1];
      await logSecurityEvent(
        clientIP,
        'unknown',
        'stock_issue',
        `Insufficient stock detected in transaction for product: ${productId}`
      );
      const response = NextResponse.json(
        { error: 'One or more products ran out of stock. Please review your cart and try again.', field: 'items' },
        { status: 409 }
      );
      return addSecurityHeaders(response);
    }

    // Log unexpected errors
    try {
      await logSecurityEvent(
        getClientIP(request),
        'unknown',
        'invalid_input',
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    } catch {}

    const response = NextResponse.json(
      { error: 'Failed to create order. Try again later.' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}
