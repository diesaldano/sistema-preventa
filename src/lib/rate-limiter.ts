/**
 * Rate Limiter - Protección contra abuse
 * 
 * Estrategia:
 * 1. Rate limit POR IP: máx 5 órdenes/hora
 * 2. Rate limit POR EMAIL: máx 2 órdenes/hora
 * 3. Deduplicación: máx 1 orden por email en 5 minutos
 * 
 * Implementación: Queries simples a BD, sin cache complejo
 * Escalabilidad: Funciona multi-servidor gracias a índices en BD
 */

import { prisma } from '@/lib/db';

export const RATE_LIMITS = {
  IP: { max: 5, windowMs: 3600_000 },          // 5 órdenes por IP / hora
  EMAIL: { max: 2, windowMs: 3600_000 },       // 2 órdenes por email / hora
  DEDUP: { windowMs: 5 * 60_000 }              // Duplicado dentro de 5 min
};

/**
 * Verificar si un cliente ha excedido rate limit por IP
 * Retorna: { ok: boolean, count: number, limit: number }
 */
export async function checkRateLimitByIP(clientIP: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMITS.IP.windowMs);

  const count = await prisma.order.count({
    where: {
      customerIP: clientIP,
      createdAt: { gte: windowStart }
    }
  });

  const limit = RATE_LIMITS.IP.max;
  const ok = count < limit;

  return { ok, count, limit };
}

/**
 * Verificar si un cliente ha excedido rate limit por EMAIL
 * Retorna: { ok: boolean, count: number, limit: number }
 */
export async function checkRateLimitByEmail(email: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMITS.EMAIL.windowMs);

  const count = await prisma.order.count({
    where: {
      customerEmail: email.toLowerCase(),
      createdAt: { gte: windowStart }
    }
  });

  const limit = RATE_LIMITS.EMAIL.max;
  const ok = count < limit;

  return { ok, count, limit };
}

/**
 * Verificar si ya existe una orden duplicada (email + tiempo)
 * Retorna: { isDuplicate: boolean, existingOrder?: Order }
 */
export async function checkDuplicateOrder(email: string) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMITS.DEDUP.windowMs);

  const existingOrder = await prisma.order.findFirst({
    where: {
      customerEmail: email.toLowerCase(),
      createdAt: { gte: windowStart }
    }
  });

  return {
    isDuplicate: !!existingOrder,
    existingOrder
  };
}

/**
 * Logging de intento fallido en security_logs
 * Para análisis posterior y detección de patrones
 */
export async function logSecurityEvent(
  clientIP: string,
  email: string,
  reason: 'rate_limit_ip' | 'rate_limit_email' | 'duplicate' | 'duplicate_atomic' | 'invalid_input' | 'fraud' | 'stock_issue' | 'rate_limit_login' | 'login_attempt_failed' | 'login_success',
  details?: string
) {
  try {
    await prisma.securityLog.create({
      data: {
        clientIp: clientIP,
        email: email.toLowerCase(),
        reason,
        details: details || null
      }
    });
  } catch (error) {
    console.error('Error logging security event:', error);
    // No lanzar error, es no-blocking
  }
}

/**
 * Helper para verificar todos los rate limits y duplicados en una sola llamada
 * Retorna info consolidada para respuesta del API
 */
export async function checkAllLimits(clientIP: string, email: string) {
  const [rateLimitIP, rateLimitEmail, duplicate] = await Promise.all([
    checkRateLimitByIP(clientIP),
    checkRateLimitByEmail(email),
    checkDuplicateOrder(email)
  ]);

  return {
    rateLimitIP,
    rateLimitEmail,
    duplicate,
    allOk: rateLimitIP.ok && rateLimitEmail.ok && !duplicate.isDuplicate
  };
}
