/**
 * PHASE 2 - R2.1-R2.2: Server-side Memory Cache con TTL
 * 
 * Cachea datos críticos (productos) en RAM del servidor por 1 hora.
 * Reduce queries a BD en 99%+ con 200-500 usuarios concurrentes.
 * 
 * VENTAJAS:
 * - Velocidad extrema (RAM es 1000x más rápida que BD)
 * - Reduce carga de Supabase
 * - Escalable (mañana migramos a Redis sin cambiar interfaz)
 * 
 * DESVENTAJAS:
 * - Datos pueden estar 1h atrasados (aceptable para productos)
 * - Cache se pierde en cada deploy (15 segundos de calor)
 * - Vercel > 1 instancia = cache local por instancia (natural)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

/**
 * Almacén en memoria (Map global)
 * Persiste mientras el proceso Node.js esté corriendo
 */
const cache = new Map<string, CacheEntry<any>>();

/**
 * Obtener datos del cache
 * @param key - Identificador único (ej: "products:all")
 * @returns Datos si existe y NO expiró, null en caso contrario
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  
  if (!entry) {
    console.log(`[Cache] MISS: ${key} (no existe)`);
    return null;
  }

  const now = Date.now();
  if (now > entry.expiresAt) {
    console.log(`[Cache] EXPIRED: ${key} (age: ${Math.floor((now - entry.createdAt) / 1000)}s)`);
    cache.delete(key);
    return null;
  }

  const ageSeconds = Math.floor((now - entry.createdAt) / 1000);
  console.log(`[Cache] HIT: ${key} (age: ${ageSeconds}s)`);
  return entry.data as T;
}

/**
 * Guardar datos en cache
 * @param key - Identificador único
 * @param data - Datos a cachear
 * @param ttlMs - Time To Live en milisegundos (default 1 hora)
 */
export function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = 3600000 // 1 hora por defecto
): void {
  const now = Date.now();
  cache.set(key, {
    data,
    expiresAt: now + ttlMs,
    createdAt: now,
  });
  
  const ttlSeconds = Math.floor(ttlMs / 1000);
  console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
}

/**
 * Invalidar cache específico
 * Útil cuando admin cambia productos o precios
 */
export function invalidateCache(key: string): void {
  if (!cache.has(key)) {
    console.log(`[Cache] INVALIDATE: ${key} (no existía)`);
    return;
  }
  
  cache.delete(key);
  console.log(`[Cache] INVALIDATED: ${key}`);
}

/**
 * Invalidar TODO el cache
 * Útil para reset completo o deploy
 */
export function invalidateAllCache(): void {
  const count = cache.size;
  cache.clear();
  console.log(`[Cache] INVALIDATED ALL (${count} entries cleared)`);
}

/**
 * Obtener estadísticas del cache actual
 */
export function getCacheStats() {
  const stats = {
    entriesCount: cache.size,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      ageSeconds: Math.floor((Date.now() - entry.createdAt) / 1000),
      expiresInSeconds: Math.floor((entry.expiresAt - Date.now()) / 1000),
      dataSize: JSON.stringify(entry.data).length,
    })),
  };
  return stats;
}

/**
 * Helper: Obtener con fallback a loader
 * Si no existe en cache, ejecuta loader() y cachea resultado
 */
export async function cacheOrLoad<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = 3600000
): Promise<T> {
  // Intenta cache primero
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss o expirado → ejecutar loader
  console.log(`[Cache] Loading ${key}...`);
  const data = await loader();
  
  // Guardar en cache para próximas veces
  setCached(key, data, ttlMs);
  
  return data;
}
