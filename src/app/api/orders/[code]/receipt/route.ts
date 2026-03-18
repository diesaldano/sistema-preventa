import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/orders/[code]/receipt
 * Carga el comprobante de pago (transferencia bancaria)
 * 
 * Body:
 * {
 *   comprobante: string (base64)
 *   comprobanteMime: string (image/png, image/jpeg, application/pdf, etc)
 * }
 * 
 * Response:
 * - 200: Orden actualizada con comprobante (status: PAYMENT_REVIEW)
 * - 404: Orden no encontrada
 * - 400: Comprobante vacío o inválido
 * - 500: Error del servidor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const body = await request.json();
    const { comprobante, comprobanteMime } = body;

    // Validar que el comprobante existe
    if (!comprobante || !comprobanteMime) {
      return NextResponse.json(
        { error: 'Comprobante y MIME type son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato MIME
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validMimes.includes(comprobanteMime)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no soportado. Use: PNG, JPG/JPEG, PDF' },
        { status: 400 }
      );
    }

    // Buscar la orden
    const existingOrder = await db.order.findUnique(code);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // No permitir cargar comprobante si ya está en estado final
    if (existingOrder.status === 'REDEEMED' || existingOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `No se puede cargar comprobante en estado ${existingOrder.status}` },
        { status: 400 }
      );
    }

    // Cargar el comprobante (esto también cambia status a PAYMENT_REVIEW)
    const updatedOrder = await db.order.uploadReceipt(code, comprobante, comprobanteMime);

    return NextResponse.json({
      success: true,
      code: updatedOrder.code,
      status: updatedOrder.status,
      message: '✓ Comprobante cargado. Esperando validación del administrador.',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al cargar comprobante' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/[code]/receipt
 * Obtiene el comprobante de una orden
 * 
 * Response:
 * - 200: { comprobante: string (base64), comprobanteMime: string }
 * - 404: Orden no encontrada o sin comprobante
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const receipt = await db.order.getReceipt(code);

    if (!receipt || !receipt.comprobante) {
      return NextResponse.json(
        { error: 'Comprobante no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Error al obtener comprobante' },
      { status: 500 }
    );
  }
}
