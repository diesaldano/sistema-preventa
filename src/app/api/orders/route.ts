import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  generateOrderCode, 
  isValidEmail, 
  isValidPhone,
  isValidName,
  sanitizeName,
  isValidComprobante 
} from '@/lib/utils';
import { Order, OrderStatus } from '@/lib/types';

/**
 * R1.4: Extraer IP del cliente desde headers
 * Funciona en desarrollo (localhost) y producción (proxies, Vercel, etc)
 */
function getClientIP(request: NextRequest): string {
  // Order: x-forwarded-for (Vercel, proxies) → x-real-ip (nginx) → fallback
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback: usar cf-connecting-ip (Cloudflare) si existe
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) {
    return cf;
  }
  
  // Último fallback: usar localhost/unknown
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
  try {
    // R3.1 + R1.4: Obtener IP del cliente PRIMERO (necesário para logging)
    const clientIP = getClientIP(request);

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
        
        // R1.2: Frontend NO envía total, backend lo recalculará
        const totalStr = formData.get('total') as string;
        total = totalStr ? parseInt(totalStr, 10) : null;

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
        return NextResponse.json(
          { error: 'Error al procesar el formulario' },
          { status: 400 }
        );
      }
    } else {
      // Parsear como JSON
      try {
        const body = await request.json();
        name = body.name || body.customerName;
        email = body.email || body.customerEmail;
        phone = body.phone || body.customerPhone;
        items = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
        // R1.2: Frontend NO envía total
        total = body.total ? 
          (typeof body.total === 'string' ? parseInt(body.total, 10) : body.total) 
          : null;
        comprobante = body.comprobante;
        comprobanteMime = body.comprobanteMime;
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        return NextResponse.json(
          { error: 'Formato de solicitud inválido' },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // PHASE 1 - R1.1: VALIDACIÓN ESTRICTA DE INPUTS
    // ============================================================

    // 1. Validar que todos los campos requeridos existan
    if (!name || !email || !phone || !items) {
      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email || 'unknown',
        'invalid_input',
        `Faltan campos: ${!name ? 'name ' : ''}${!email ? 'email ' : ''}${!phone ? 'phone ' : ''}${!items ? 'items' : ''}`
      );

      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, email, teléfono, productos' },
        { status: 400 }
      );
    }

    // 2. Validar NOMBRE (2-50 caracteres, sin números)
    if (!isValidName(name)) {
      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'invalid_input',
        `Nombre inválido: "${name}" (longitud: ${name.length})`
      );

      return NextResponse.json(
        { 
          error: 'Nombre inválido. Debe tener 2-50 caracteres, sin números',
          field: 'name'
        },
        { status: 400 }
      );
    }
    
    // Sanitizar nombre (trim, single spaces)
    const sanitizedName = sanitizeName(name);

    // 3. Validar EMAIL (formato estricto)
    if (!isValidEmail(email)) {
      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'invalid_input',
        `Email inválido: "${email}"`
      );

      return NextResponse.json(
        { 
          error: 'Email inválido. Verifica el formato (ej: nombre@dominio.com)',
          field: 'email'
        },
        { status: 400 }
      );
    }

    // 4. Validar TELÉFONO (Argentina, 10+ dígitos)
    if (!isValidPhone(phone)) {
      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'invalid_input',
        `Teléfono inválido: "${phone}" (dígitos: ${(phone || '').replace(/\D/g, '').length})`
      );

      return NextResponse.json(
        { 
          error: 'Teléfono inválido. Debe tener al menos 10 dígitos',
          field: 'phone'
        },
        { status: 400 }
      );
    }

    // 5. Validar ITEMS (array no vacío)
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { 
          error: 'El carrito está vacío. Agrega al menos un producto',
          field: 'items'
        },
        { status: 400 }
      );
    }

    // 6. Validar cada item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.productId || item.quantity === undefined) {
        return NextResponse.json(
          { 
            error: `Producto ${i + 1} inválido: falta productId o cantidad`,
            field: 'items'
          },
          { status: 400 }
        );
      }
      
      const quantity = parseInt(item.quantity, 10);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          { 
            error: `Producto ${i + 1}: cantidad debe ser un número positivo`,
            field: 'items'
          },
          { status: 400 }
        );
      }
    }

    // 7. Validar COMPROBANTE si existe
    if (comprobante && comprobanteMime) {
      const comprobanteValidation = isValidComprobante(comprobanteMime, Buffer.byteLength(comprobante));
      if (!comprobanteValidation.valid) {
        return NextResponse.json(
          { 
            error: comprobanteValidation.error,
            field: 'comprobante'
          },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // PHASE 1 - R1.3: PREVENIR DOBLE-CREACIÓN
    // Detecta si hay orden duplicada en últimos 5 minutos
    // ============================================================

    const recentOrder = await db.order.findRecentByEmail(email.toLowerCase().trim());
    if (recentOrder) {
      console.warn(`⚠️ DOBLE-CREACIÓN DETECTADA: ${email}`, {
        email,
        recentOrderCode: recentOrder.code,
        recentOrderTime: recentOrder.createdAt,
        timestamp: new Date().toISOString(),
      });

      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'duplicate',
        `Intento de crear orden duplicada. Orden previa: ${recentOrder.code}`
      );
      
      return NextResponse.json(
        {
          error: `Ya existe una orden reciente (${recentOrder.code}). Si necesitas crear otra, espera 5 minutos.`,
          field: 'duplicate',
          recentOrderCode: recentOrder.code,
          recentOrderStatus: recentOrder.status,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // ============================================================
    // PHASE 1 - R1.4: RATE LIMITING
    // Previene abuso de creación de órdenes por IP/email
    // Límite: 2 órdenes por email en 1 hora
    // ============================================================

    const recentOrdersByEmail = await db.order.countByEmailInLastHour(
      email.toLowerCase().trim()
    );

    // LÍMITE: máximo 2 órdenes por email en 1 hora (R1.3 cubre 5 min window)
    // Si ya tiene 1 orden en última hora, puede crear 1 más
    // Si intenta 3ª orden → bloqueado temporalmente
    if (recentOrdersByEmail >= 2) {
      console.warn(`🚫 RATE LIMIT EXCEDIDO: ${email}`, {
        email,
        ip: clientIP,
        ordersInLastHour: recentOrdersByEmail,
        limit: 2,
        timestamp: new Date().toISOString(),
      });

      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'rate_limit',
        `Excedió límite de 2 órdenes/hora. Cuenta: ${recentOrdersByEmail}`
      );

      // Obtener detalles de órdenes recientes para análisis
      const recentOrders = await db.order.getRecentOrdersByEmail(email, 1);

      return NextResponse.json(
        {
          error: 'Límite de órdenes alcanzado. Espera 1 hora antes de crear otra.',
          field: 'rate_limit',
          rateLimitExceeded: true,
          retryAfterSeconds: 3600,
          recentOrdersCount: recentOrdersByEmail,
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // ============================================================
    // PHASE 1 - R1.2: RECALCULAR TOTAL DESDE BD
    // SIN CONFIAR EN FRONTEND - PREVENIR FRAUDES
    // ============================================================

    // Calcular total REAL desde base de datos
    const totalCalculation = await db.order.calculateTotalFromItems(
      items.map((item: any) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
        price: item.price ? parseInt(item.price, 10) : undefined,
      }))
    );

    // 8.1 Si hay fraude detectado (precio modificado)
    if (totalCalculation.fraudDetected) {
      console.warn(`🚨 FRAUDE DETECTADO: ${email} intentó modificar precios`, {
        email,
        details: totalCalculation.details,
        timestamp: new Date().toISOString(),
      });

      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'fraud',
        `Intento de modificar precios: ${totalCalculation.details.filter((d: any) => !d.match).map((d: any) => `${d.productId}: ${d.frontendPrice} vs ${d.bdPrice}`).join('; ')}`
      );
      
      return NextResponse.json(
        {
          error: 'Intento de fraude detectado: precios fueron modificados',
          field: 'fraud',
          fraudAlert: true,
        },
        { status: 400 }
      );
    }

    // 8.2 Si hay problema de stock insuficiente
    if (totalCalculation.stockIssue) {
      console.warn(`Stock insuficiente: ${email}`, {
        email,
        details: totalCalculation.details,
        timestamp: new Date().toISOString(),
      });

      // R3.1: Log security event
      await db.securityLog.create(
        clientIP,
        email,
        'stock_issue',
        `Stock insuficiente para: ${totalCalculation.details.filter((d: any) => d.stockIssue).map((d: any) => d.productId).join(', ')}`
      );
      
      return NextResponse.json(
        {
          error: 'Stock insuficiente para completar la orden',
          field: 'stock',
          details: totalCalculation.details,
        },
        { status: 400 }
      );
    }

    // 8.3 Si algún producto no existe
    if (!totalCalculation.valid && totalCalculation.details.some((d: any) => d.fraudFlag)) {
      console.warn(`Producto inválido detectado: ${email}`, {
        email,
        details: totalCalculation.details,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        {
          error: 'Uno o más productos no existen',
          field: 'items',
          details: totalCalculation.details,
        },
        { status: 400 }
      );
    }

    // ✅ Si llegó aquí: orden es válida
    // Usar el TOTAL RECALCULADO, no el del frontend
    const validatedTotal = totalCalculation.total;

    // ============================================================
    // Si llegó aquí, todos los inputs son válidos
    // Crear la orden con TOTAL RECALCULADO
    // ============================================================

    const code = generateOrderCode();
    const now = new Date();
    const status: OrderStatus = comprobante ? 'PAYMENT_REVIEW' : 'PENDING_PAYMENT';
    
    const order: Order = {
      code,
      customerName: sanitizedName,
      customerEmail: email.toLowerCase().trim(),
      customerPhone: phone.replace(/\D/g, ''),
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity, 10),
        price: typeof item.price === 'string' ? parseInt(item.price, 10) : item.price,
      })),
      total: validatedTotal, // ✅ TOTAL RECALCULADO DESDE BD
      status,
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
      { error: error instanceof Error ? error.message : 'Error al crear el pedido' },
      { status: 500 }
    );
  }
}
