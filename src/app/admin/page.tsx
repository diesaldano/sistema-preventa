'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-context';
import { formatPrice } from '@/lib/utils';
import { BrandHeader } from '@/components/brand-header';
import { getPollingConfig, savePollingConfig, PollingConfig } from '@/lib/polling-config';

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
  
  // R2.3: Polling config (enabled/disabled + seconds)
  const [pollingConfig, setPollingConfig] = useState<PollingConfig>({
    enabled: false,
    intervalMs: 5000,
  });

  // Cargar config guardada al montar
  useEffect(() => {
    const saved = getPollingConfig();
    setPollingConfig(saved);
  }, []);

  /**
   * R2.3: Toggle polling on/off
   */
  const handleTogglePolling = () => {
    const newConfig = { ...pollingConfig, enabled: !pollingConfig.enabled };
    setPollingConfig(newConfig);
    savePollingConfig(newConfig);
  };

  /**
   * R2.3: Cambiar intervalo en segundos
   */
  const handleChangeInterval = (seconds: number) => {
    const newConfig = { ...pollingConfig, intervalMs: seconds * 1000 };
    setPollingConfig(newConfig);
    savePollingConfig(newConfig);
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
      refreshInterval: pollingConfig.enabled ? pollingConfig.intervalMs : 0,
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
        <div className={`rounded-lg border p-4 mb-8 transition-colors ${
          isDark
            ? 'border-slate-700 bg-slate-900'
            : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className={`text-sm font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Auto-refresh de órdenes:
              </label>
              <button
                onClick={handleTogglePolling}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  pollingConfig.enabled
                    ? isDark
                      ? 'bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {pollingConfig.enabled ? '✓ ACTIVADO' : '○ DESACTIVADO'}
              </button>
            </div>

            {pollingConfig.enabled && (
              <div className="flex items-center gap-3">
                <label className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Cada:
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pollingConfig.intervalMs / 1000}
                  onChange={(e) => handleChangeInterval(Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))}
                  className={`w-16 px-2 py-1 rounded text-center text-sm font-mono ${
                    isDark
                      ? 'bg-slate-800 border border-slate-700 text-slate-100'
                      : 'bg-white border border-slate-300 text-slate-900'
                  }`}
                />
                <span className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  segundos
                </span>
              </div>
            )}
          </div>
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
