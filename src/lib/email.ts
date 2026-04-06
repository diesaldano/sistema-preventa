/**
 * Servicio de email para notificaciones del sistema
 * Integración con Resend (https://resend.com)
 */

import { ADMIN_CONFIG } from './constants';

// Importar Resend solo si la clave está disponible
let resend: any = null;
if (process.env.RESEND_API_KEY) {
  try {
    const ResendLib = require('resend').Resend;
    resend = new ResendLib(process.env.RESEND_API_KEY);
  } catch (error) {
    console.warn('⚠️ [EMAIL] Resend no está instalado. Instala con: npm install resend');
  }
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Enviar email usando Resend
 * Resend es un servicio moderno de email para desarrolladores
 * - Sin necesidad de configurar SMTP
 * - API simple y clara
 * - Escalable y confiable
 */
export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    // Si no hay Resend configurado, loguear en consola (desarrollo)
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log('📧 [EMAIL] (DEV MODE - Resend no configurado):');
      console.log(`   To: ${payload.to}`);
      console.log(`   Subject: ${payload.subject}`);
      console.log(`   Body preview: ${payload.html.substring(0, 100)}...`);
      return { success: true };
    }

    // Enviar con Resend
    const response = await resend.emails.send({
      from: 'Preventa DIEZ <noreply@preventa.diezproducciones.com>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: payload.replyTo || 'diez.producciones.arg@gmail.com',
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    console.log(`📧 [EMAIL] Enviado exitosamente a ${payload.to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [EMAIL] Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al enviar email',
    };
  }
}

/**
 * Notificar al admin que hay un nuevo comprobante para revisar
 */
export async function notifyAdminNewComprobante(orderCode: string, customerName: string, customerEmail: string, total: number) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">
        🔔 Nuevo Comprobante de Pago
      </h2>
      
      <p style="color: #4b5563; font-size: 14px; margin: 20px 0;">
        Un cliente acaba de subir un comprobante de pago. Requiere tu revisión.
      </p>
      
      <div style="background-color: #f3f4f6; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Código de Orden:</strong> <span style="color: #f59e0b; font-size: 18px;">${orderCode}</span></p>
        <p style="margin: 8px 0;"><strong>Cliente:</strong> ${customerName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${customerEmail}</p>
        <p style="margin: 8px 0;"><strong>Monto:</strong> $${total.toLocaleString('es-AR')}</p>
      </div>
      
      <div style="margin: 20px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin" 
           style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Revisar en Dashboard
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Sistema Automático de Preventa DIEZ PRODUCCIONES
      </p>
    </div>
  `;

  return sendEmail({
    to: ADMIN_CONFIG.EMAIL,
    subject: `🔔 Nuevo comprobante: ${orderCode} - $${total}`,
    html,
    replyTo: customerEmail,
  });
}

/**
 * Enviar comprobante al cliente (por solicitud del usuario)
 */
export async function sendComprobanteToCustomer(
  orderCode: string,
  customerEmail: string,
  customerName: string,
  comprobanteMime: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; border-bottom: 3px solid #f59e0b; padding-bottom: 10px;">
        ✅ Comprobante de tu Pedido
      </h2>
      
      <p style="color: #4b5563; font-size: 14px; margin: 20px 0;">
        Hola ${customerName},
      </p>
      
      <p style="color: #4b5563; font-size: 14px; margin: 20px 0;">
        Aquí está el comprobante de pago para tu orden.
      </p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Código de Orden:</strong> <strong style="color: #16a34a;">${orderCode}</strong></p>
        <p style="margin: 8px 0; color: #6b7280; font-size: 12px;">Tipo: ${comprobanteMime}</p>
      </div>
      
      <div style="margin: 20px 0; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pedido/${orderCode}" 
           style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Ver mi Pedido
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px;">
        Si tienes preguntas, responde este email o contacta con nuestro equipo.
      </p>
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        Preventa DIEZ PRODUCCIONES
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `📄 Comprobante de tu pedido: ${orderCode}`,
    html,
    replyTo: ADMIN_CONFIG.EMAIL,
  });
}
