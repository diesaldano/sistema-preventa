/**
 * Constantes globales de la aplicación
 * Datos inmutables y configuración del sistema
 */

export const EVENT_CONFIG = {
  band: 'AUTOS ROBADOS',
  venue: 'DIVA ROCK',
  year: '24 de Abril',
  subtitle: 'Preventa oficial de bebidas',
} as const;

export const BANK_DATA = {
  alias: 'DIEZPRODUCCIONES.AR',
  cbu: '0000003100066349309123',
  bank: 'Mercado Pago',
  titular: 'Maria Paula Sosa',
} as const;

export const CHECKOUT_CONFIG = {
  TRANSFER_TIMEOUT_MINUTES: 5,
  TRANSFER_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutos en milisegundos
} as const;

export const ADMIN_CONFIG = {
  EMAIL: 'diez.producciones.arg@gmail.com',
  NOTIFICATION_ON_COMPROBANTE: true,
} as const;
