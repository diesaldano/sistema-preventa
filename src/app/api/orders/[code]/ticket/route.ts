import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOrderTicketHTML } from '@/lib/ticket';

/**
 * GET /api/orders/[code]/ticket
 * Descargar ticket de compra como HTML
 * 
 * El cliente puede:
 * - Descargar el HTML directamente
 * - O usar html2pdf para convertir a PDF
 */
export async function GET(
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

    // Generar HTML del ticket
    const ticketHTML = generateOrderTicketHTML(order as any);

    // Devolver como HTML para que el navegador lo descargue
    return new NextResponse(ticketHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="ticket-${code}.html"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('❌ Error downloading ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al descargar ticket' },
      { status: 500 }
    );
  }
}
