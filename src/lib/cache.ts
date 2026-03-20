'use client';

/**
 * PHASE 2 - Client-side Cache Manager
 * localStorage + timestamp validation
 * No bloqueos, sin locks, simple TTL
 */

const CACHE_VERSION = '1';
const PRODUCT_CACHE_KEY = `products-v${CACHE_VERSION}`;
const CACHE_TTL = 3600000; // 1 hora en ms

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Guardar en localStorage con timestamp
 */
export function setCacheData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.warn(`[Cache] Error saving to localStorage:`, err);
  }
}

/**
 * Obtener de localStorage si es válido (< 1h)
 * Retorna null si expiró o no existe
 */
export function getCacheData<T>(key: string, ttl: number = CACHE_TTL): T | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > ttl) {
      // Expirado, borrar
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (err) {
    console.warn(`[Cache] Error reading from localStorage:`, err);
    return null;
  }
}

/**
 * Borrar cache específico
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Cache] Error clearing cache:`, err);
  }
}

/**
 * Borrar todo el cache
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('products-') || key.startsWith('orders-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn(`[Cache] Error clearing all cache:`, err);
  }
}

/**
 * Helper: check si cache es válido sin obtener datos
 */
export function isCacheValid(key: string, ttl: number = CACHE_TTL): boolean {
  try {
    const item = localStorage.getItem(key);
    if (!item) return false;

    const entry: CacheEntry<any> = JSON.parse(item);
    const now = Date.now();
    const age = now - entry.timestamp;

    return age <= ttl;
  } catch {
    return false;
  }
}

/**
 * Helper: obtener age en segundos
 */
export function getCacheAge(key: string): number {
  try {
    const item = localStorage.getItem(key);
    if (!item) return -1;

    const entry: CacheEntry<any> = JSON.parse(item);
    const age = Date.now() - entry.timestamp;
    return Math.floor(age / 1000);
  } catch {
    return -1;
  }
}

// ===== PRODUCTS CACHE HELPERS =====

export function cacheProducts<T>(products: T[]): void {
  setCacheData(PRODUCT_CACHE_KEY, products);
}

export function getCachedProducts<T>(): T[] | null {
  return getCacheData<T[]>(PRODUCT_CACHE_KEY);
}

export function clearProductsCache(): void {
  clearCache(PRODUCT_CACHE_KEY);
}

export function isProductsCacheValid(): boolean {
  return isCacheValid(PRODUCT_CACHE_KEY);
}
