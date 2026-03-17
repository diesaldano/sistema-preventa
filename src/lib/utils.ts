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
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate phone format (Argentina)
 */
export function isValidPhone(phone: string): boolean {
  // Basic validation for Argentine phone numbers
  return /^\d{10,}$/.test(phone.replace(/\D/g, ''));
}
