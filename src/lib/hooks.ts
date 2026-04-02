'use client';

import { useEffect, useState } from 'react';
import { Product, Order } from './types';
import { getCachedProducts, cacheProducts, isProductsCacheValid } from './cache';

/**
 * PHASE 2 - R2.1: useProducts con caching automático
 * 1. Intenta leer de localStorage (valido < 1h)
 * 2. Si cache está fresco, lo usa sin fetch
 * 3. Si expiró, hace fetch y cachea
 * 
 * Sin bloqueos ni locks, solo simple check de timestamp
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // R2.1: Intenta cache primero
        if (isProductsCacheValid()) {
          const cached = getCachedProducts<Product>();
          if (cached) {
            setProducts(cached);
            setCacheHit(true);
            setLoading(false);
            console.log('[Cache] Products from localStorage', cached.length);
            return;
          }
        }

        // Cache expiró o no existe, fetch desde BD
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        
        // R2.1: Guardar en cache para próximas visitas
        cacheProducts(data);
        setCacheHit(false);
        setProducts(data);
        console.log('[Cache] Products from server, saved to localStorage', data.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching products');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error, cacheHit };
}

/**
 * PHASE 2 - R2.3: useOrderPolling
 * 
 * Smart polling para /pedido/[code]
 * - Chequea si polling está enabled en servidor
 * - Si enabled: refetch status cada N segundos
 * - Timeout automático después de 5 minutos
 * - Sin botón manual (0 spam risk)
 */
export function useOrderPolling(orderCode: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    let pollingInterval: NodeJS.Timeout | null = null;
    let pollingTimeout: NodeJS.Timeout | null = null;
    let isComponentMounted = true;

    async function fetchOrderStatus() {
      try {
        const response = await fetch(`/api/orders/${orderCode}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        
        if (isComponentMounted) {
          setOrder(data);
          setLastUpdate(new Date());
          setError(null);
        }
      } catch (err) {
        if (isComponentMounted) {
          setError(err instanceof Error ? err.message : 'Error fetching order');
        }
      }
    }

    async function initPolling() {
      try {
        // Obtener config de polling desde servidor
        const configResponse = await fetch('/api/polling-config');
        if (!configResponse.ok) {
          throw new Error('Failed to get polling config');
        }

        const config = await configResponse.json();

        if (!isComponentMounted) return;

        if (config.enabled) {
          console.log(
            `[Polling] ENABLED for ${orderCode} at ${config.intervalMs / 1000}s interval`
          );
          setIsPolling(true);

          // Fetch inicial
          await fetchOrderStatus();

          // Setup polling interval
          pollingInterval = setInterval(fetchOrderStatus, config.intervalMs);

          // Setup timeout (5 minutos)
          pollingTimeout = setTimeout(() => {
            console.log(`[Polling] TIMEOUT for ${orderCode} after 5 minutes`);
            if (pollingInterval) {
              clearInterval(pollingInterval);
              pollingInterval = null;
            }
            if (isComponentMounted) {
              setIsPolling(false);
            }
          }, 300000); // 5 minutos
        } else {
          console.log(`[Polling] DISABLED for ${orderCode}`);
          setIsPolling(false);
          // Solo fetch una vez
          await fetchOrderStatus();
        }

        if (isComponentMounted) {
          setLoading(false);
        }
      } catch (err) {
        if (isComponentMounted) {
          console.error('[Polling] Error initializing:', err);
          setError(err instanceof Error ? err.message : 'Error initializing polling');
          setLoading(false);
        }
      }
    }

    initPolling();

    // Cleanup
    return () => {
      isComponentMounted = false;
      if (pollingInterval) clearInterval(pollingInterval);
      if (pollingTimeout) clearTimeout(pollingTimeout);
    };
  }, [orderCode]);

  return { order, loading, error, isPolling, lastUpdate };
}
