'use client';

import { useEffect, useState } from 'react';
import { Product } from './types';
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
