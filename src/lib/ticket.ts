import { Order } from './types';
import { formatPrice } from './utils';

/**
 * Generar HTML del ticket de compra
 * Usado para descargar como PDF o enviar por email
 */
export function generateOrderTicketHTML(order: Order): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsHTML = order.items
    .map((item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${idx + 1}</td>
        <td style="padding: 12px; text-align: left;">${item.productId}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">${formatPrice(item.price)}</td>
        <td style="padding: 12px; text-align: right; font-weight: bold;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket ${order.code}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          background: #f3f4f6;
          padding: 20px;
        }
        .ticket-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border: 2px solid #1f2937;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .ticket-header {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .ticket-header h1 {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 10px;
          letter-spacing: 4px;
          font-family: 'Arial Black', sans-serif;
        }
        .ticket-header p {
          font-size: 14px;
          opacity: 0.9;
        }
        .ticket-content {
          padding: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 12px;
          font-weight: bold;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          border-bottom: 2px dashed #d1d5db;
          padding-bottom: 8px;
        }
        .customer-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          font-size: 13px;
        }
        .customer-info-item label {
          display: block;
          font-size: 11px;
          color: #6b7280;
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .customer-info-item p {
          color: #1f2937;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        table thead {
          background: #f3f4f6;
        }
        table th {
          padding: 12px;
          text-align: left;
          font-weight: bold;
          color: #1f2937;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px dashed #d1d5db;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .summary-row.total {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .ticket-footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 11px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer-message {
          margin-bottom: 10px;
          font-weight: bold;
          color: #059669;
        }
        .footer-code {
          font-size: 12px;
          font-family: 'Courier New', monospace;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          margin-top: 8px;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <!-- HEADER -->
        <div class="ticket-header">
          <h1>${order.code}</h1>
          <p>TICKET DE COMPRA</p>
        </div>

        <!-- CONTENT -->
        <div class="ticket-content">
          <!-- CLIENTE -->
          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="customer-info">
              <div class="customer-info-item">
                <label>Nombre</label>
                <p>${order.customerName}</p>
              </div>
              <div class="customer-info-item">
                <label>Email</label>
                <p>${order.customerEmail}</p>
              </div>
              <div class="customer-info-item">
                <label>Teléfono</label>
                <p>${order.customerPhone}</p>
              </div>
              <div class="customer-info-item">
                <label>Fecha</label>
                <p>${formattedDate}</p>
              </div>
            </div>
          </div>

          <!-- PRODUCTOS -->
          <div class="section">
            <div class="section-title">Detalles de Compra</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 40%;">Producto</th>
                  <th style="width: 15%; text-align: center;">Cantidad</th>
                  <th style="width: 20%; text-align: right;">Precio Unit.</th>
                  <th style="width: 20%; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <!-- RESUMEN -->
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatPrice(order.total)}</span>
              </div>
              <div class="summary-row">
                <span>Descuentos/Impuestos:</span>
                <span>$0.00</span>
              </div>
              <div class="summary-row total">
                <span>TOTAL:</span>
                <span>${formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="ticket-footer">
          <div class="footer-message">✓ Compra Registrada</div>
          <p>Presenta este ticket o el código ${order.code} el día del evento para retirar tu pedido.</p>
          <div class="footer-code">Código: ${order.code}</div>
          <p style="margin-top: 12px; font-size: 10px;">Generado: ${formattedDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generar PDF del ticket usando html2pdf en cliente
 * O usar en servidor con puppeteer/playwright
 */
export async function generateOrderTicketPDF(order: Order): Promise<Blob> {
  // Este código se ejecuta en el servidor
  // Necesita puppeteer o similar
  throw new Error('Use generateOrderTicketHTML + client-side library');
}
