import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOrderCode } from '@/lib/utils';
import { Order, OrderStatus } from '@/lib/types';
import { 
  validateEmail, 
  validatePhone,
  validateName,
  validateItems,
  validateComprobante,
  calculateTotalFromItems,
  verifyTotal
} from '@/lib/validators';
import { 
  checkRateLimitByIP,
  checkRateLimitByEmail,
  checkDuplicateOrder,
  logSecurityEvent
} from '@/lib/rate-limiter';

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
    let comprobante: string | null = null;
    let comprobanteMime: string | null = null;

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
        
        const file = formData.get('comprobante') as File | null;
        if (file && file.size > 0) {
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          comprobante = Buffer.from(bytes).toString('base64');
          comprobanteMime = file.type;
        }
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
        comprobante = body.comprobante;
        comprobanteMime = body.comprobanteMime;
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
    const normalizedEmail = (customerEmail as string).toLowerCase().trim();

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
    const sanitizedName = (customerName as string).trim();

    // Validar items
    const itemsValidation = await validateItems(items);
    if (!itemsValidation.valid) {
      await logSecurityEvent(clientIP, normalizedEmail, 'invalid_input', `Items: ${itemsValidation.error}`);
      return NextResponse.json({ error: itemsValidation.error, field: 'items' }, { status: 400 });
    }

    // Calcular total desde precios actuales de BD
    const serverTotal = calculateTotalFromItems(itemsValidation.validatedItems!);

    // Verificar total del cliente vs servidor
    if (clientTotal) {
      const totalVerification = verifyTotal(clientTotal, serverTotal);
      if (!totalVerification.valid) {
        await logSecurityEvent(clientIP, normalizedEmail, 'fraud', `Total mismatch: client=${clientTotal}, server=${serverTotal}`);
        return NextResponse.json({ error: totalVerification.error, field: 'total' }, { status: 400 });
      }
    }

    // Validar comprobante si existe
    if (comprobante || comprobanteMime) {
      const comprobanteValidation = await validateComprobante(comprobante, comprobanteMime);
      if (!comprobanteValidation.valid) {
        await logSecurityEvent(clientIP, normalizedEmail, 'invalid_input', `Comprobante: ${comprobanteValidation.error}`);
        return NextResponse.json({ error: comprobanteValidation.error, field: 'comprobante' }, { status: 400 });
      }
    }

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
    // 5. CREATE ORDER - ALL VALIDATIONS PASSED
    // ============================================================

    const code = generateOrderCode();
    const now = new Date();
    const status: OrderStatus = comprobante ? 'PAYMENT_REVIEW' : 'PENDING_PAYMENT';
    
    const order: Order = {
      code,
      customerName: sanitizedName,
      customerEmail: normalizedEmail,
      customerPhone: customerPhone!.replace(/\D/g, ''),
      items: itemsValidation.validatedItems!.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      total: serverTotal,
      status,
      comprobante: comprobante || undefined,
      comprobanteMime: comprobanteMime || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Add customerIP to order before saving
    const orderWithIP = {
      ...order,
      customerIP: clientIP,
    } as any;

    const createdOrder = await db.order.create(orderWithIP);
    
    console.log(`✅ ORDER CREATED: ${code} | Email: ${normalizedEmail} | IP: ${clientIP} | Total: $${serverTotal}`);

    return NextResponse.json(createdOrder, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    // Log unexpected errors
    try {
      await logSecurityEvent(
        getClientIP(request),
        'unknown',
        'invalid_input',
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    } catch {}

    return NextResponse.json(
      { error: 'Failed to create order. Try again later.' },
      { status: 500 }
    );
  }
}
