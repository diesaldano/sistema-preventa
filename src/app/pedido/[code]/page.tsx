'use client';

import { useEffect, useState } from 'react';
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

export default function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    async function resolveParams() {
      const { code: orderCode } = await params;
      setCode(orderCode);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!code) return;

    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${code}`);
        const data = await response.json();

        if (!response.ok || !data.code) {
          throw new Error(data.error ?? 'Pedido no encontrado');
        }

        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [code]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'PAYMENT_REVIEW':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'PAID':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'REDEEMED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return '⏳ Esperando tu pago (transferencia)';
      case 'PAYMENT_REVIEW':
        return '👀 Tu pago está siendo revisado';
      case 'PAID':
        return '✓ Pago confirmado. Listo para retirar';
      case 'REDEEMED':
        return '✓ Retirado en evento';
      case 'CANCELLED':
        return '✗ Pedido rechazado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950">
        <BrandHeader 
          event="Cargando pedido..."
          subtitle="Preventa oficial de bebidas"
        />
        <div className="mx-auto max-w-2xl px-6 py-12 text-center">
          <p className="text-slate-400">Por favor espera...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-950">
        <BrandHeader 
          event="Error"
          subtitle="Preventa oficial de bebidas"
        />
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-300 font-medium">{error || 'Pedido no encontrado'}</p>
            <Link href="/" className="mt-4 inline-block text-sm text-amber-400 hover:text-amber-300">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <BrandHeader 
        event="Pedido Confirmado"
        subtitle="Preventa oficial de bebidas"
      />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-6">
          <Link href="/" className="text-sm text-amber-400 hover:text-amber-300">
            ← Volver al inicio
          </Link>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-900/40">
          {/* Estado */}
          <div className="mb-6 pb-6 border-b border-slate-800">
            <div className={`inline-block px-4 py-2 rounded-lg border font-medium text-sm ${getStatusBadgeColor(order.status)}`}>
              {getStatusText(order.status)}
            </div>
          </div>

          {/* Código y Detalles */}
          <div className="mb-6 pb-6 border-b border-slate-800">
            <p className="text-sm text-slate-400 mb-2">Código de Retiro</p>
            <p className="text-5xl font-bebas font-bold text-amber-400 mb-6 tracking-widest">
              {order.code}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-slate-400">Nombre</p>
                <p className="font-medium text-slate-100">{order.customerName}</p>
              </div>
              <div>
                <p className="text-slate-400">Email</p>
                <p className="font-medium text-slate-100">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-slate-400">Teléfono</p>
                <p className="font-medium text-slate-100">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-slate-400">Fecha</p>
                <p className="font-medium text-slate-100">
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="mb-6 pb-6 border-b border-slate-800">
            <h3 className="font-semibold text-slate-100 mb-4">Productos</h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-slate-800/50 border border-slate-800 p-3 rounded">
                  <div>
                    <p className="font-medium text-slate-100">Producto #{idx + 1}</p>
                    <p className="text-xs text-slate-400">{item.productId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-100">x{item.quantity}</p>
                    <p className="text-xs text-amber-400">{formatPrice(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg font-semibold text-slate-100">Total</p>
            <p className="text-2xl font-bold font-bebas text-amber-400 tracking-wide">{formatPrice(order.total)}</p>
          </div>

          {/* Mensaje según estado */}
          <div className="rounded-lg bg-slate-800/50 border border-slate-800 p-4 text-center">
            {order.status === 'PENDING_PAYMENT' ? (
              <p className="text-yellow-300 font-medium">
                Tu pedido está pendiente de pago. Por favor realiza la transferencia bancaria.
              </p>
            ) : order.status === 'PAYMENT_REVIEW' ? (
              <p className="text-amber-300 font-medium">
                Tu pago ya fue recibido. Nuestro equipo está revisándolo. Te notificaremos pronto.
              </p>
            ) : order.status === 'PAID' ? (
              <p className="text-emerald-300 font-medium">
                ¡Pago confirmado! Tu pedido está listo. Presenta el código <span className="font-bebas font-bold text-lg tracking-wide">{order.code}</span> el día del evento para retirar.
              </p>
            ) : order.status === 'REDEEMED' ? (
              <p className="text-blue-300 font-medium">
                ✓ Tu pedido fue retirado exitosamente. ¡Gracias por tu compra!
              </p>
            ) : order.status === 'CANCELLED' ? (
              <p className="text-red-300 font-medium">
                ✗ Tu pedido ha sido cancelado. Por favor contacta con nosotros si tienes dudas.
              </p>
            ) : (
              <p className="text-slate-300 font-medium">
                Estado: {getStatusText(order.status)}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
