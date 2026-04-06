import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateComprobante } from '@/lib/validators';
import { notifyAdminNewComprobante } from '@/lib/email';

/**
 * POST /api/orders/[code]/upload-comprobante
 * Usuario sube su comprobante de pago
 * 
 * Requisitos:
 * - Orden debe estar en estado PENDING_PAYMENT
 * - Archivo debe ser JPG/PNG/PDF, <5MB
 * 
 * Transición: PENDING_PAYMENT → PAYMENT_REVIEW
 * 
 * Response:
 * - 200: Comprobante subido, status=PAYMENT_REVIEW
 * - 404: Orden no encontrada
 * - 400: Estado inválido, archivo inválido, o archivo ya cargado
 * - 500: Error del servidor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  try {
    // Buscar orden
    const order = await db.order.findUnique(code);

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Solo puede subir comprobante si está en PENDING_PAYMENT
    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        {
          error: `No se puede subir comprobante desde estado ${order.status}. La orden debe estar en PENDING_PAYMENT.`,
          currentStatus: order.status,
        },
        { status: 400 }
      );
    }

    // Si ya tiene comprobante, no permitir actualizar (evitar reemplazar)
    if (order.comprobante) {
      return NextResponse.json(
        {
          error: 'Esta orden ya tiene un comprobante cargado.',
          status: order.status,
        },
        { status: 400 }
      );
    }

    // Parsear FormData para obtener archivo
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Se requiere enviar el comprobante como multipart/form-data' },
        { status: 400 }
      );
    }

    let comprobante: string | null = null;
    let comprobanteMime: string | null = null;

    try {
      const formData = await request.formData();
      const file = formData.get('comprobante') as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json(
          { error: 'No se envió archivo de comprobante' },
          { status: 400 }
        );
      }

      // Convertir a base64
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      comprobante = Buffer.from(bytes).toString('base64');
      comprobanteMime = file.type;
    } catch (error) {
      console.error('Error parsing FormData:', error);
      return NextResponse.json(
        { error: 'Error al procesar el archivo' },
        { status: 400 }
      );
    }

    // Validar comprobante
    const validation = await validateComprobante(comprobante, comprobanteMime);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, field: 'comprobante' },
        { status: 400 }
      );
    }

    // Actualizar orden: agregar comprobante y cambiar status
    const updatedOrder = await db.order.uploadReceipt(code, comprobante, comprobanteMime);

    console.log(`✅ COMPROBANTE UPLOADED: ${code} | Status: PENDING_PAYMENT → PAYMENT_REVIEW`);

    // 📧 Notificar al admin que hay un comprobante para revisar
    await notifyAdminNewComprobante(
      code,
      updatedOrder.customerName,
      updatedOrder.customerEmail,
      updatedOrder.total
    );

    return NextResponse.json(updatedOrder, { status: 200 });

  } catch (error) {
    console.error('❌ Error uploading comprobante:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir comprobante' },
      { status: 500 }
    );
  }
}
