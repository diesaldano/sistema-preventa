'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
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
    productId: number;
    quantity: number;
    unitPrice: number;
  }>;
};

function OrderDisplay({ order, isDark }: { order: Order; isDark: boolean }) {
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

  return (
    <div className={`rounded-lg border p-6 shadow-lg transition-colors ${isDark ? 'border-slate-800 bg-slate-900 shadow-slate-900/40' : 'border-slate-200 bg-slate-50 shadow-slate-300/20'}`}>
      {/* Estado */}
      <div className={`mb-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className={`inline-block px-4 py-2 rounded-lg border font-medium text-sm ${getStatusBadgeColor(order.status)}`}>
          {getStatusText(order.status)}
        </div>
      </div>

      {/* Código y Detalles */}
      <div className={`mb-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Código de Retiro</p>
        <p className={`text-5xl font-bebas font-bold mb-6 tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
          {order.code}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Nombre</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{order.customerName}</p>
          </div>
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Email</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{order.customerEmail}</p>
          </div>
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Teléfono</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{order.customerPhone}</p>
          </div>
          <div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Fecha</p>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {new Date(order.createdAt).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>
      </div>

      {/* Productos */}
      <div className={`mb-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <h3 className={`font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Productos</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between text-sm border p-3 rounded transition-colors ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <div>
                <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Producto #{idx + 1}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.productId}</p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>x{item.quantity}</p>
                <p className={isDark ? 'text-xs text-amber-400' : 'text-xs text-amber-600'}>{formatPrice(item.unitPrice)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between mb-6">
        <p className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Total</p>
        <p className={`text-2xl font-bold font-bebas tracking-wide ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{formatPrice(order.total)}</p>
      </div>

      {/* Mensaje según estado */}
      <div className={`rounded-lg border p-4 text-center transition-colors ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-amber-50 border-amber-200'}`}>
        {order.status === 'PENDING_PAYMENT' ? (
          <p className={isDark ? 'text-yellow-300 font-medium' : 'text-yellow-700 font-medium'}>
            Tu pedido está pendiente de pago. Por favor realiza la transferencia bancaria.
          </p>
        ) : order.status === 'PAYMENT_REVIEW' ? (
          <p className={isDark ? 'text-amber-300 font-medium' : 'text-amber-700 font-medium'}>
            Tu pago ya fue recibido. Nuestro equipo está revisándolo. Te notificaremos pronto.
          </p>
        ) : order.status === 'PAID' ? (
          <p className={isDark ? 'text-emerald-300 font-medium' : 'text-emerald-700 font-medium'}>
            ¡Pago confirmado! Tu pedido está listo. Presenta el código <span className="font-bebas font-bold text-lg tracking-wide">{order.code}</span> el día del evento para retirar.
          </p>
        ) : order.status === 'REDEEMED' ? (
          <p className={isDark ? 'text-blue-300 font-medium' : 'text-blue-700 font-medium'}>
            ✓ Tu pedido fue retirado exitosamente. ¡Gracias por tu compra!
          </p>
        ) : order.status === 'CANCELLED' ? (
          <p className={isDark ? 'text-red-300 font-medium' : 'text-red-700 font-medium'}>
            ✗ Tu pedido ha sido cancelado. Por favor contacta con nosotros si tienes dudas.
          </p>
        ) : (
          <p className={isDark ? 'text-slate-300 font-medium' : 'text-slate-700 font-medium'}>
            Estado: {getStatusText(order.status)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const { code: orderCode } = await params;
        setCode(orderCode);
      } catch (err) {
        setError('Error al resolver parámetros');
        setLoading(false);
      }
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!code) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${code}`);
        const data = await response.json();

        if (!response.ok || !data.code) {
          setError(data.error ?? 'Pedido no encontrado');
          setOrder(null);
        } else {
          setOrder(data);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el pedido');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [code]);

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader 
        event={loading ? 'Cargando...' : error ? 'Error' : 'Pedido'}
        subtitle="Preventa oficial de bebidas"
      />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-6">
          <Link href="/" className={`text-sm ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'}`}>
            ← Volver al inicio
          </Link>
        </div>

        {loading && (
          <div className={`rounded-lg border p-12 text-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Cargando tu pedido...</p>
          </div>
        )}

        {error && !loading && (
          <div className={`rounded-lg border p-6 text-center ${isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-300 bg-red-50'}`}>
            <p className={`font-medium mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            <Link href="/" className={`inline-block text-sm ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 hover:text-slate-900'}`}>
              Volver al inicio
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <OrderDisplay order={order} isDark={isDark} />
        )}
      </div>
    </main>
  );
}
