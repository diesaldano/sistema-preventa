'use client';

import { useState } from 'react';
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
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export default function DespachoPage() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch(`/api/orders/${code}`);
      const data = await response.json();

      if (!response.ok || !data.code) {
        throw new Error(data.error ?? 'Pedido no encontrado');
      }

      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar el pedido');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeliver() {
    if (!order) return;

    setDelivering(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.code}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Error al marcar como entregado');
      }

      setOrder(data);
      alert('¡Pedido marcado como entregado!');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setDelivering(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <BrandHeader 
        event="Sistema de Despacho"
        subtitle="DIEZ PRODUCCIONES - Entrega de Pedidos"
      />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Buscador */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 mb-6">
          <h2 className="font-semibold text-slate-100 mb-4">Buscar Pedido</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: AR-483"
              className="flex-1 rounded-lg border border-slate-800 bg-slate-800/50 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !code}
              className="rounded-lg bg-amber-500 hover:bg-amber-600 px-6 py-2 font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {/* Resultado */}
        {order && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6 pb-6 border-b border-slate-800">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-semibold text-amber-400 font-bebas tracking-wide">
                  {order.code}
                </h2>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    order.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : order.status === 'DELIVERED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {order.status === 'PENDING_VALIDATION'
                    ? 'Pago Pendiente'
                    : order.status === 'CONFIRMED'
                      ? 'Listo para Retirar'
                      : order.status === 'DELIVERED'
                        ? 'Entregado'
                        : 'Cancelado'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-slate-400">Cliente</p>
                  <p className="font-medium text-slate-100">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-400">Teléfono</p>
                  <p className="font-medium text-slate-100">{order.customerPhone}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-100 mb-3">Productos</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-slate-800/50 border border-slate-800">
                    <span className="text-slate-300">Producto ID: {item.productId}</span>
                    <span className="font-medium text-slate-100">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="mb-6 pb-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-100">Total</p>
                <p className="font-mono text-lg font-bold text-amber-400">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>

            {/* Acción */}
            {order.status === 'DELIVERED' ? (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center text-emerald-300">
                Pedido ya entregado
              </div>
            ) : order.status === 'CONFIRMED' ? (
              <button
                onClick={handleDeliver}
                disabled={delivering}
                className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-3 font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {delivering ? 'Marcando...' : 'Marcar como Entregado'}
              </button>
            ) : (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-center text-amber-300">
                Debe estar confirmado para entregar
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
