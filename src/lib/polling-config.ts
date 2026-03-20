/**
 * PHASE 2 - R2.3: Polling Configuration
 * Simple on/off + configurable interval
 * No locks, no complexity
 */

export interface PollingConfig {
  enabled: boolean;
  intervalMs: number;
}

// Default: polling DISABLED, 5 segundos si se activa
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  enabled: false,
  intervalMs: 10000, // 5 segundos
};

/**
 * Obtener config de polling desde estado global o localStorage
 */
export function getPollingConfig(): PollingConfig {
  try {
    const stored = localStorage.getItem('polling-config');
    if (stored) {
      return JSON.parse(stored) as PollingConfig;
    }
  } catch {
    // Ignorar si hay error
  }
  return DEFAULT_POLLING_CONFIG;
}

/**
 * Guardar config de polling
 */
export function savePollingConfig(config: PollingConfig): void {
  try {
    localStorage.setItem('polling-config', JSON.stringify(config));
  } catch (err) {
    console.warn('[Polling] Error saving config:', err);
  }
}

/**
 * Helper: toggle polling on/off
 */
export function togglePolling(): PollingConfig {
  const config = getPollingConfig();
  const newConfig = { ...config, enabled: !config.enabled };
  savePollingConfig(newConfig);
  return newConfig;
}

/**
 * Helper: cambiar intervalo
 */
export function setPollingInterval(intervalMs: number): PollingConfig {
  const config = getPollingConfig();
  const newConfig = { ...config, intervalMs };
  savePollingConfig(newConfig);
  return newConfig;
}
