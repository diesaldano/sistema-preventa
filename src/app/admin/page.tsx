'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-context';
import { formatPrice } from '@/lib/utils';
import { BrandHeader } from '@/components/brand-header';
import { PollingConfig, POLLING_CONFIG_LIMITS } from '@/lib/polling-config';

type Order = {
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
};

/**
 * PHASE 2 - R2.3: Fetcher para SWR
 */
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export default function AdminPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [processing, setProcessing] = useState<string | null>(null);
  const [pollingUpdating, setPollingUpdating] = useState(false);
  
  // R2.3: Polling config desde servidor
  const { data: pollingConfig, mutate: mutatePolling } = useSWR<PollingConfig>(
    '/api/polling-config',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  /**
   * R2.3: Toggle polling on/off (via API)
   */
  const handleTogglePolling = async () => {
    if (!pollingConfig) return;
    
    setPollingUpdating(true);
    try {
      const response = await fetch('/api/polling-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !pollingConfig.enabled,
          intervalMs: pollingConfig.intervalMs,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar polling');
      }

      await mutatePolling();
    } catch (err) {
      console.error('Error toggling polling:', err);
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setPollingUpdating(false);
    }
  };

  /**
   * R2.3: Cambiar intervalo en segundos (via API)
   */
  const handleChangeInterval = async (seconds: number) => {
    if (!pollingConfig) return;
    
    // Validar limites
    const clamped = Math.max(
      POLLING_CONFIG_LIMITS.MIN_INTERVAL_MS / 1000,
      Math.min(seconds, POLLING_CONFIG_LIMITS.MAX_INTERVAL_MS / 1000)
    );

    setPollingUpdating(true);
    try {
      const response = await fetch('/api/polling-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: pollingConfig.enabled,
          intervalMs: clamped * 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar intervalo');
      }

      await mutatePolling();
    } catch (err) {
      console.error('Error changing interval:', err);
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setPollingUpdating(false);
    }
  };

  /**
   * PHASE 2 - R2.3: useSWR con polling configurable
   * - refreshInterval: 0 si disabled, intervalMs si enabled
   * - Sin bloqueos, simple config
   */
  const { data, error, isLoading, mutate } = useSWR<Order[]>(
    '/api/orders',
    fetcher,
    {
      refreshInterval: pollingConfig?.enabled ? pollingConfig.intervalMs : 0,
      dedupingInterval: 2000,
      fallbackData: [],
    }
  );

  const orders = data || [];
  const loading = isLoading && orders.length === 0;
  const hasError = error !== undefined;

  async function handleValidate(code: string) {
    setProcessing(code);
    try {
      const response = await fetch(`/api/orders/${code}/validate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al validar');
      }

      // R2.3: Usar mutate() para refetch automático
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(code: string) {
    if (!confirm('¿Rechazar este pedido?')) return;

    setProcessing(code);
    try {
      const response = await fetch(`/api/orders/${code}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al rechazar');
      }

      // R2.3: Usar mutate() para refetch automático
      mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setProcessing(null);
    }
  }

  const pendingOrders = orders.filter((o: Order) => o.status === 'PAYMENT_REVIEW' || o.status === 'PENDING_PAYMENT');
  const confirmadoOrders = orders.filter((o: Order) => o.status === 'PAID');
  const deliveredOrders = orders.filter((o: Order) => o.status === 'REDEEMED');
  const cancelledOrders = orders.filter((o: Order) => o.status === 'CANCELLED');

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader 
        event="Panel de Validación"
        subtitle="DIEZ PRODUCCIONES - Sistema de Validación"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {hasError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-6">
            Error al cargar los pedidos
          </div>
        )}

        {/* POLLING CONTROL - R2.3 */}
        <div className={`rounded-lg border p-6 mb-8 transition-colors ${
          isDark
            ? 'border-blue-500/30 bg-blue-500/5'
            : 'border-blue-300 bg-blue-100/50'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDark ? 'text-blue-400' : 'text-blue-700'
          }`}>
            ⚙️ Control de Polling en Tiempo Real
          </h3>

          {!pollingConfig ? (
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Cargando configuración...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Activar auto-actualización:
                </label>
                <button
                  onClick={handleTogglePolling}
                  disabled={pollingUpdating}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                    pollingConfig.enabled
                      ? isDark
                        ? 'bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/40 disabled:opacity-50'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50'
                  }`}
                >
                  {pollingUpdating && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  {pollingConfig.enabled ? '✓ ACTIVADO' : '○ DESACTIVADO'}
                </button>
              </div>

              {/* Intervalo */}
              {pollingConfig.enabled && (
                <div className="flex items-center justify-between pt-4 border-t border-blue-300/30">
                  <label className={`text-sm font-medium ${
                    isDark ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Intervalo de actualización:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={POLLING_CONFIG_LIMITS.MIN_INTERVAL_MS / 1000}
                      max={POLLING_CONFIG_LIMITS.MAX_INTERVAL_MS / 1000}
                      value={pollingConfig.intervalMs / 1000}
                      onChange={(e) => handleChangeInterval(parseInt(e.target.value) || 30)}
                      disabled={pollingUpdating}
                      className={`w-20 px-3 py-2 rounded text-center text-sm font-mono font-semibold transition ${
                        isDark
                          ? 'bg-slate-800 border border-slate-700 text-slate-100 disabled:opacity-50 focus:border-blue-500'
                          : 'bg-white border border-slate-300 text-slate-900 disabled:opacity-50 focus:border-blue-500'
                      }`}
                    />
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-blue-300' : 'text-blue-700'
                    }`}>
                      segundos
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-blue-200 text-blue-700'
                    }`}>
                      {pollingConfig.intervalMs / 1000 > 30 ? '1 vez/min' : `2x/min`}
                    </span>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className={`text-xs p-3 rounded mt-4 ${
                isDark
                  ? 'bg-slate-800/50 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                <p className="font-medium mb-1">ℹ️ Información:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Cuando está <strong>activado</strong>: Los usuarios en /pedido/[code] verán actualizaciones automáticas</li>
                  <li>Intervalo mínimo: 10 segundos | Máximo: 120 segundos</li>
                  <li>Default recomendado: 30 segundos (2 actualizaciones por minuto)</li>
                  <li>Con 500 usuarios: ~{Math.round((500 * 2) / 60)} requests/segundo</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 sm:grid-cols-5 mb-8">
          <div className={`rounded-lg border p-4 transition-colors ${
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-slate-200 bg-slate-50'
          }`}>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>Total Pedidos</p>
            <p className={`text-3xl font-bold ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>{orders.length}</p>
          </div>
          <div className={`rounded-lg border p-4 transition-colors ${
            isDark
              ? 'border-yellow-500/30 bg-yellow-500/10'
              : 'border-yellow-300 bg-yellow-100/50'
          }`}>
            <p className={`text-sm font-medium ${
              isDark ? 'text-yellow-400' : 'text-yellow-700'
            }`}>Pendientes</p>
            <p className={`text-3xl font-bold ${
              isDark ? 'text-yellow-300' : 'text-yellow-600'
            }`}>{pendingOrders.length}</p>
          </div>
          <div className={`rounded-lg border p-4 transition-colors ${
            isDark
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-emerald-300 bg-emerald-100/50'
          }`}>
            <p className={`text-sm font-medium ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>Confirmados</p>
            <p className={`text-3xl font-bold ${
              isDark ? 'text-emerald-300' : 'text-emerald-600'
            }`}>{confirmadoOrders.length}</p>
          </div>
          <div className={`rounded-lg border p-4 transition-colors ${
            isDark
              ? 'border-blue-500/30 bg-blue-500/10'
              : 'border-blue-300 bg-blue-100/50'
          }`}>
            <p className={`text-sm font-medium ${
              isDark ? 'text-blue-400' : 'text-blue-700'
            }`}>Entregados</p>
            <p className={`text-3xl font-bold ${
              isDark ? 'text-blue-300' : 'text-blue-600'
            }`}>{deliveredOrders.length}</p>
          </div>
          <div className={`rounded-lg border p-4 transition-colors ${
            isDark
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-red-300 bg-red-100/50'
          }`}>
            <p className={`text-sm font-medium ${
              isDark ? 'text-red-400' : 'text-red-700'
            }`}>Cancelados</p>
            <p className={`text-3xl font-bold ${
              isDark ? 'text-red-300' : 'text-red-600'
            }`}>{cancelledOrders.length}</p>
          </div>
        </div>

        {/* Pendientes de Validación */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Pendientes de Validación ({pendingOrders.length})
          </h2>

          {loading ? (
            <div className={`text-center py-8 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>Cargando...</div>
          ) : pendingOrders.length === 0 ? (
            <div className={`rounded-lg border p-6 text-center transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900/50 text-slate-400'
                : 'border-slate-200 bg-slate-100/50 text-slate-600'
            }`}>
              No hay pedidos pendientes
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order: Order) => (
                <div
                  key={order.code}
                  className={`rounded-lg border p-4 transition-colors ${
                    isDark
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-yellow-300 bg-yellow-100/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <p className={`font-semibold font-mono ${
                        isDark ? 'text-yellow-400' : 'text-yellow-700'
                      }`}>{order.code}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>{order.customerName}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>{order.customerEmail}</p>
                    </div>
                    <p className={`font-mono font-bold ${
                      isDark ? 'text-yellow-400' : 'text-yellow-700'
                    }`}>
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidate(order.code)}
                      disabled={processing === order.code}
                      className="flex-1 rounded px-3 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition disabled:opacity-50"
                    >
                      Validar
                    </button>
                    <button
                      onClick={() => handleReject(order.code)}
                      disabled={processing === order.code}
                      className="flex-1 rounded px-3 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmados */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Confirmados ({confirmadoOrders.length})
          </h2>

          {confirmadoOrders.length === 0 ? (
            <div className={`rounded-lg border p-6 text-center transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900/50 text-slate-400'
                : 'border-slate-200 bg-slate-100/50 text-slate-600'
            }`}>
              No hay pedidos confirmados
            </div>
          ) : (
            <div className="space-y-3">
              {confirmadoOrders.map((order: Order) => (
                <div key={order.code} className={`rounded-lg border p-4 transition-colors ${
                  isDark
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-emerald-300 bg-emerald-100/50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-semibold font-mono ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}>{order.code}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>{order.customerName}</p>
                    </div>
                    <p className={`font-mono font-bold ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Entregados */}
        <div className="mb-8">
          <h2 className={`text-xl font-semibold mb-4 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Entregados ({deliveredOrders.length})
          </h2>

          {deliveredOrders.length === 0 ? (
            <div className={`rounded-lg border p-6 text-center transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900/50 text-slate-400'
                : 'border-slate-200 bg-slate-100/50 text-slate-600'
            }`}>
              No hay pedidos entregados
            </div>
          ) : (
            <div className="space-y-3">
              {deliveredOrders.map((order: Order) => (
                <div key={order.code} className={`rounded-lg border p-4 transition-colors ${
                  isDark
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-blue-300 bg-blue-100/50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-semibold font-mono ${
                        isDark ? 'text-blue-400' : 'text-blue-700'
                      }`}>{order.code}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>{order.customerName}</p>
                    </div>
                    <p className={`font-mono font-bold ${
                      isDark ? 'text-blue-400' : 'text-blue-700'
                    }`}>
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancelados */}
        <div>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Cancelados ({cancelledOrders.length})
          </h2>

          {cancelledOrders.length === 0 ? (
            <div className={`rounded-lg border p-6 text-center transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900/50 text-slate-400'
                : 'border-slate-200 bg-slate-100/50 text-slate-600'
            }`}>
              No hay pedidos cancelados
            </div>
          ) : (
            <div className="space-y-3">
              {cancelledOrders.map((order: Order) => (
                <div key={order.code} className={`rounded-lg border p-4 transition-colors ${
                  isDark
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-red-300 bg-red-100/50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-semibold font-mono ${
                        isDark ? 'text-red-400' : 'text-red-700'
                      }`}>{order.code}</p>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>{order.customerName}</p>
                    </div>
                    <p className={`font-mono font-bold ${
                      isDark ? 'text-red-400' : 'text-red-700'
                    }`}>
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
