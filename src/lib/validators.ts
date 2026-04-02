/**
 * Backend Input Validation - STRICT & SECURITY-FOCUSED
 * 
 * Todos los inputs deben ser validados AQUÍ en el backend
 * 
 * Reglas:
 * - Email: RFC 5322 básico, lowercase
 * - Teléfono: 10+ dígitos (Argentina)
 * - Nombre: 2-50 chars, solo letras/espacios
 * - Items: producto existe, cantidad valid, stock disponible
 */

import { prisma } from '@/lib/db';

/**
 * Validar email
 * RFC 5322 básico (no exhaustivo, solo lo razonable)
 */
export function validateEmail(email: unknown): { valid: boolean; error?: string } {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be string' };
  }

  const trimmed = email.trim().toLowerCase();

  // Check longitud
  if (trimmed.length < 5 || trimmed.length > 254) {
    return { valid: false, error: 'Email length must be 5-254 characters' };
  }

  // Regex básico RFC 5322 simplificado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Verificar que no tenga caracteres peligrosos
  if (/[<>"%';()&+]/.test(trimmed)) {
    return { valid: false, error: 'Email contains forbidden characters' };
  }

  return { valid: true };
}

/**
 * Validar teléfono
 * Argentina: 10+ dígitos (ej: 1123456789 o +5491123456789)
 */
export function validatePhone(phone: unknown): { valid: boolean; error?: string } {
  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be string' };
  }

  const digits = phone.replace(/\D/g, '');

  // Mínimo 10 dígitos (Argentina)
  if (digits.length < 10) {
    return { valid: false, error: 'Phone must have at least 10 digits' };
  }

  // Máximo 15 dígitos (E.164 estándar)
  if (digits.length > 15) {
    return { valid: false, error: 'Phone must have at most 15 digits' };
  }

  return { valid: true };
}

/**
 * Validar nombre
 * 2-50 caracteres, solo letras, espacios, guiones (para apelativos)
 */
export function validateName(name: unknown): { valid: boolean; error?: string } {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be string' };
  }

  const trimmed = name.trim();

  // Longitud
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { valid: false, error: 'Name must be 2-50 characters' };
  }

  // Solo letras, espacios, guiones, apóstrofes
  if (!/^[a-záéíóúàèìòùäëïöüâêîôûñçA-ZÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÑÇ\s\-']+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { valid: true };
}

/**
 * Validar cantidad
 */
export function validateQuantity(qty: unknown): { valid: boolean; error?: string } {
  if (typeof qty !== 'number' && typeof qty !== 'string') {
    return { valid: false, error: 'Quantity must be number or string' };
  }

  const num = typeof qty === 'string' ? parseInt(qty, 10) : qty;

  if (!Number.isInteger(num) || num < 1 || num > 999) {
    return { valid: false, error: 'Quantity must be integer between 1-999' };
  }

  return { valid: true };
}

/**
 * Validar que un producto existe y tiene stock suficiente
 * Retorna el precio actual del producto si es válido
 */
export async function validateProductAndStock(
  productId: string,
  requestedQuantity: number
): Promise<{ valid: boolean; error?: string; price?: number }> {
  if (typeof productId !== 'string' || productId.length === 0) {
    return { valid: false, error: 'Product ID is required' };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return { valid: false, error: `Product not found: ${productId}` };
    }

    if (product.stock < requestedQuantity) {
      return {
        valid: false,
        error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${requestedQuantity}`
      };
    }

    return { valid: true, price: product.price };
  } catch (error) {
    console.error('Error validating product:', error);
    return { valid: false, error: 'Error validating product' };
  }
}

/**
 * Validar lista de items
 * Cada item: { productId, quantity }
 * Retorna lista validada con precios actuales si es válida
 */
export async function validateItems(items: unknown): Promise<{
  valid: boolean;
  error?: string;
  validatedItems?: Array<{ productId: string; quantity: number; price: number }>;
}> {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Items must be non-empty array' };
  }

  if (items.length > 50) {
    return { valid: false, error: 'Too many items (max 50)' };
  }

  const validatedItems: Array<{ productId: string; quantity: number; price: number }> = [];

  for (const item of items) {
    if (typeof item !== 'object' || !item) {
      return { valid: false, error: 'Each item must be object' };
    }

    const { productId, quantity } = item;

    // Validar cantidad
    const qtyCheck = validateQuantity(quantity);
    if (!qtyCheck.valid) {
      return { valid: false, error: qtyCheck.error };
    }

    // Validar producto y stock
    const productCheck = await validateProductAndStock(productId, quantity);
    if (!productCheck.valid) {
      return { valid: false, error: productCheck.error };
    }

    validatedItems.push({
      productId,
      quantity,
      price: productCheck.price!
    });
  }

  return { valid: true, validatedItems };
}

/**
 * Calcular total esperado basado en precios actuales de BD
 * NUNCA confiar en el total del frontend
 */
export function calculateTotalFromItems(
  validatedItems: Array<{ productId: string; quantity: number; price: number }>
): number {
  return validatedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/**
 * Verificar si total enviado por cliente coincide con cálculo
 * Permitir pequeñas variaciones (1-2%) por redondeos de frontend
 */
export function verifyTotal(
  clientTotal: number,
  serverTotal: number,
  tolerancePercent: number = 2
): { valid: boolean; error?: string } {
  if (clientTotal <= 0) {
    return { valid: false, error: 'Total must be positive' };
  }

  if (serverTotal <= 0) {
    return { valid: false, error: 'Server total calculation error' };
  }

  const maxDeviation = (serverTotal * tolerancePercent) / 100;
  const deviation = Math.abs(clientTotal - serverTotal);

  if (deviation > maxDeviation) {
    return {
      valid: false,
      error: `Total mismatch. Expected ~${serverTotal}, got ${clientTotal}`
    };
  }

  return { valid: true };
}

/**
 * Validar archivo comprobante (si se envía)
 * 
 * Reglas:
 * - Opcional (puede ser null)
 * - Si presente: max 5MB, JPG/PNG
 * - Base64 validado
 */
export async function validateComprobante(
  comprobanteBase64: unknown,
  mime: unknown
): Promise<{ valid: boolean; error?: string; size?: number }> {
  // Si es null/undefined, OK (es opcional)
  if (!comprobanteBase64 && !mime) {
    return { valid: true };
  }

  if (typeof comprobanteBase64 !== 'string') {
    return { valid: false, error: 'Comprobante must be base64 string' };
  }

  if (typeof mime !== 'string') {
    return { valid: false, error: 'MIME type must be string' };
  }

  // Validar MIME
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(mime)) {
    return { valid: false, error: `MIME must be one of: ${allowedMimes.join(', ')}` };
  }

  // Estimar tamaño del base64
  // Base64 = 1.33x tamaño original
  const estimatedSize = Math.ceil((comprobanteBase64.length * 6) / 8);

  if (estimatedSize > 5_000_000) {
    return { valid: false, error: 'Comprobante file too large (max 5MB)' };
  }

  // Verificar que sea base64 válido
  try {
    const buffer = Buffer.from(comprobanteBase64, 'base64');
    if (buffer.length === 0) {
      return { valid: false, error: 'Comprobante is empty' };
    }
  } catch {
    return { valid: false, error: 'Invalid base64 encoding' };
  }

  return { valid: true, size: estimatedSize };
}
