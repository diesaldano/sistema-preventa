import { NextRequest, NextResponse } from 'next/server';
import { 
  DEFAULT_POLLING_CONFIG, 
  PollingConfig,
  POLLING_CONFIG_LIMITS 
} from '@/lib/polling-config';
import { setCached, getCached, invalidateCache } from '@/lib/server-cache';

const POLLING_CONFIG_CACHE_KEY = 'polling:config';
const POLLING_CONFIG_CACHE_TTL = 60000; // 1 minuto

/**
 * PHASE 2 - R2.3: GET /api/polling-config
 * 
 * Retorna configuración de polling actual
 * - Almacenada en localStorage del cliente
 * - Cacheada 1 minuto en servidor
 * - Sin autenticación (público, para que cliente sepa config)
 */
export async function GET(request: NextRequest) {
  try {
    // Intentar cache del servidor primero
    const cached = getCached<PollingConfig>(POLLING_CONFIG_CACHE_KEY);
    if (cached) {
      console.log('[Polling API] GET config from server cache');
      return NextResponse.json(cached);
    }

    // Por ahora, leer del DEFAULT (en PHASE 4, leer de BD)
    const config = DEFAULT_POLLING_CONFIG;

    // Cachear por 1 minuto
    setCached(POLLING_CONFIG_CACHE_KEY, config, POLLING_CONFIG_CACHE_TTL);

    console.log('[Polling API] GET config from default:', config);
    return NextResponse.json(config);
  } catch (error) {
    console.error('[Polling API] Error getting config:', error);
    return NextResponse.json(
      { error: 'Failed to get polling config' },
      { status: 500 }
    );
  }
}

/**
 * PHASE 2 - R2.3: POST /api/polling-config
 * 
 * Actualiza configuración de polling
 * - Solo admin (TODO: PHASE 4 - verificar auth)
 * - Valida limites
 * - Invalida cache
 * - Retorna config actualizada
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: PHASE 4 - Verificar que usuario es admin
    // Por ahora permitir a cualquiera para testing
    
    const body = await request.json();
    const { enabled, intervalMs } = body;

    // Validar estructura
    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid enabled: must be boolean' },
        { status: 400 }
      );
    }

    if (typeof intervalMs !== 'number') {
      return NextResponse.json(
        { error: 'Invalid intervalMs: must be number' },
        { status: 400 }
      );
    }

    // Validar limites
    if (
      intervalMs < POLLING_CONFIG_LIMITS.MIN_INTERVAL_MS ||
      intervalMs > POLLING_CONFIG_LIMITS.MAX_INTERVAL_MS
    ) {
      return NextResponse.json(
        {
          error: `intervalMs must be between ${POLLING_CONFIG_LIMITS.MIN_INTERVAL_MS}ms and ${POLLING_CONFIG_LIMITS.MAX_INTERVAL_MS}ms`,
        },
        { status: 400 }
      );
    }

    // Crear config actualizada
    const newConfig: PollingConfig = { enabled, intervalMs };

    // Invalidar cache del servidor
    invalidateCache(POLLING_CONFIG_CACHE_KEY);

    // Cachear nueva config
    setCached(POLLING_CONFIG_CACHE_KEY, newConfig, POLLING_CONFIG_CACHE_TTL);

    console.log('[Polling API] POST config updated:', {
      enabled,
      intervalSeconds: intervalMs / 1000,
    });

    return NextResponse.json({
      success: true,
      config: newConfig,
      message: `Polling ${enabled ? 'ENABLED' : 'DISABLED'} at ${intervalMs / 1000}s interval`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Polling API] Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update polling config' },
      { status: 500 }
    );
  }
}
