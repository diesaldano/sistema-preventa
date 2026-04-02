/**
 * PHASE 2 - R2.3: Polling Configuration
 * 
 * Smart polling para /pedido/[code]
 * - Default: DESACTIVADO (0 costo)
 * - Intervalo: 30 segundos (2 llamadas/min)
 * - Configurable por admin
 * - Timeout automático 5 minutos
 */

export interface PollingConfig {
  enabled: boolean;
  intervalMs: number; // milliseconds (30000 = 30s)
}

// Default: polling DESACTIVADO, 30 segundos si se activa
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  enabled: false,
  intervalMs: 30000, // 30 segundos = 2 llamadas por minuto
};

// Limites para configuración
export const POLLING_CONFIG_LIMITS = {
  MIN_INTERVAL_MS: 10000, // 10 segundos mínimo
  MAX_INTERVAL_MS: 120000, // 120 segundos máximo
  DEFAULT_TIMEOUT_MS: 300000, // 5 minutos timeout automático
};

/**
 * Obtener config de polling desde localStorage
 * Fallback a DEFAULT si no existe o error
 */
export function getPollingConfigFromLocal(): PollingConfig {
  try {
    const stored = localStorage.getItem('polling-config');
    if (stored) {
      const parsed = JSON.parse(stored) as PollingConfig;
      // Validar que values están dentro de límites
      if (
        parsed.intervalMs >= POLLING_CONFIG_LIMITS.MIN_INTERVAL_MS &&
        parsed.intervalMs <= POLLING_CONFIG_LIMITS.MAX_INTERVAL_MS
      ) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Polling] Error reading config from localStorage:', err);
  }
  return DEFAULT_POLLING_CONFIG;
}

/**
 * Guardar config en localStorage
 */
export function savePollingConfigToLocal(config: PollingConfig): void {
  try {
    localStorage.setItem('polling-config', JSON.stringify(config));
  } catch (err) {
    console.warn('[Polling] Error saving config to localStorage:', err);
  }
}

/**
 * Helper: toggle polling on/off
 */
export function togglePollingLocal(): PollingConfig {
  const config = getPollingConfigFromLocal();
  const newConfig: PollingConfig = { ...config, enabled: !config.enabled };
  savePollingConfigToLocal(newConfig);
  console.log('[Polling] Toggled:', newConfig);
  return newConfig;
}

/**
 * Helper: cambiar intervalo
 */
export function setPollingIntervalLocal(intervalMs: number): PollingConfig {
  // Validar limites
  const clamped = Math.max(
    POLLING_CONFIG_LIMITS.MIN_INTERVAL_MS,
    Math.min(intervalMs, POLLING_CONFIG_LIMITS.MAX_INTERVAL_MS)
  );

  const config = getPollingConfigFromLocal();
  const newConfig: PollingConfig = { ...config, intervalMs: clamped };
  savePollingConfigToLocal(newConfig);
  console.log('[Polling] Interval updated:', `${clamped}ms (${clamped / 1000}s)`);
  return newConfig;
}

/**
 * Helper: habilitar/deshabilitar polling
 */
export function setPollingEnabledLocal(enabled: boolean): PollingConfig {
  const config = getPollingConfigFromLocal();
  const newConfig: PollingConfig = { ...config, enabled };
  savePollingConfigToLocal(newConfig);
  console.log('[Polling]', enabled ? 'ENABLED' : 'DISABLED');
  return newConfig;
}
