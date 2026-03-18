'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { BrandHeader } from '@/components/brand-header';

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
    unitPrice: number;
  }>;
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate(code: string) {
    setProcessing(code);
    try {
      const response = await fetch(`/api/orders/${code}/validate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al validar');
      }

      await fetchOrders();
      alert('¡Pedido validado!');
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

      await fetchOrders();
      alert('¡Pedido rechazado!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setProcessing(null);
    }
  }

  const pendingOrders = orders.filter((o) => o.status === 'PAYMENT_REVIEW');
  const confirmadoOrders = orders.filter((o) => o.status === 'PAID');

  return (
    <main className="min-h-screen bg-slate-950">
      <BrandHeader 
        event="Panel de Validación"
        subtitle="DIEZ PRODUCCIONES - Sistema de Validación"
      />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">Total Pedidos</p>
            <p className="text-3xl font-bold text-slate-100">{orders.length}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400 font-medium">Pendientes de Validar</p>
            <p className="text-3xl font-bold text-amber-300">{pendingOrders.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-400 font-medium">Confirmados</p>
            <p className="text-3xl font-bold text-emerald-300">{confirmadoOrders.length}</p>
          </div>
        </div>

        {/* Pendientes de Validación */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Pendientes de Validación ({pendingOrders.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando...</div>
          ) : pendingOrders.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
              No hay pedidos pendientes
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.code}
                  className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-amber-400 font-mono">{order.code}</p>
                      <p className="text-sm text-slate-300">{order.customerName}</p>
                      <p className="text-sm text-slate-400">{order.customerEmail}</p>
                    </div>
                    <p className="font-mono font-bold text-amber-400">
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
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Confirmados ({confirmadoOrders.length})
          </h2>

          {confirmadoOrders.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
              No hay pedidos confirmados
            </div>
          ) : (
            <div className="space-y-3">
              {confirmadoOrders.map((order) => (
                <div key={order.code} className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-400 font-mono">{order.code}</p>
                      <p className="text-sm text-slate-300">{order.customerName}</p>
                    </div>
                    <p className="font-mono font-bold text-emerald-400">
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
