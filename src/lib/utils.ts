/**
 * Generate unique order code
 * Format: AR-XXX (e.g., AR-483)
 */
export function generateOrderCode(): string {
  const random = Math.floor(Math.random() * 1000);
  return `AR-${random.toString().padStart(3, '0')}`;
}

/**
 * Format price to peso currency
 * Price is stored directly in ARS pesos (e.g., 6000 = $6.000)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Validate email format (strict)
 * - Must have @ and . with content between
 * - No spaces allowed
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const regex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(trimmed) && trimmed.length <= 254;
}

/**
 * Validate phone format (Argentina)
 * - Must have 10+ digits
 * - Strips non-digits and validates
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return /^\d{10,}$/.test(digitsOnly);
}

/**
 * Validate customer name
 * - 2-50 characters
 * - No numbers allowed
 * - Letters, spaces, hyphens, accents OK
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  
  // Check length
  if (trimmed.length < 2 || trimmed.length > 50) return false;
  
  // Check for numbers (not allowed)
  if (/\d/.test(trimmed)) return false;
  
  // Allow: letters (including accents), spaces, hyphens, apostrophes
  // Pattern: allow letters, spaces, hyphens, apostrophes
  return /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s'-]+$/.test(trimmed);
}

/**
 * Sanitize name (trim, single spaces, capitalize)
 */
export function sanitizeName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ') // Single spaces
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
}

/**
 * Validate comprobante (receipt) file
 * - Only JPG or PNG allowed
 * - Max 5MB
 */
export function isValidComprobante(
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  // Check MIME type
  const allowedMimes = ['image/jpeg', 'image/png'];
  if (!mimeType || !allowedMimes.includes(mimeType)) {
    return { valid: false, error: 'Comprobante debe ser JPG o PNG' };
  }
  
  // Check file size (5MB = 5242880 bytes)
  const maxSizeBytes = 5 * 1024 * 1024;
  if (sizeBytes > maxSizeBytes) {
    return { valid: false, error: 'Comprobante no puede exceder 5MB' };
  }
  
  return { valid: true };
}
