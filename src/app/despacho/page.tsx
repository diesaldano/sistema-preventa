'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { useToastContext } from '@/lib/toast-context';
import { formatPrice } from '@/lib/utils';
import { BrandHeader } from '@/components/brand-header';
import { UserHeader } from '@/components/user-header';

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
    price: number;
  }>;
};

export default function DespachoPage() {
  const { theme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToastContext();
  const isDark = theme === 'dark';
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivering, setDelivering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/despacho/login');
    }
  }, [user, authLoading, router]);

  // Si está cargando la autenticación, mostrar pantalla de carga
  if (authLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <BrandHeader 
          event="Sistema de Despacho"
          subtitle="DIEZ PRODUCCIONES - Entrega de Pedidos"
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <div className="inline-block mb-4 w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
            <p>Verificando autenticación...</p>
          </div>
        </div>
      </main>
    );
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!user) {
    return null;
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/despacho/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  }

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
      toast.success('Pedido marcado como entregado exitosamente', '✓ Éxito');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setDelivering(false);
    }
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader 
        event="Sistema de Despacho"
        subtitle="DIEZ PRODUCCIONES - Entrega de Pedidos"
      />

      {/* User Info Bar - Componente Genérico */}
      <UserHeader 
        email={user.email} 
        role={user.role} 
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* Buscador */}
        <div className={`rounded-lg border p-6 mb-6 transition-colors ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200 bg-white'
        }`}>
          <h2 className={`font-semibold mb-4 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>Buscar Pedido</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: AR-483"
              className={`flex-1 rounded-lg border px-4 py-2 focus:outline-none focus:border-transparent focus:ring-2 transition-colors ${
                isDark
                  ? 'border-slate-800 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:ring-slate-700'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:ring-blue-600'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !code}
              className={`rounded-lg px-6 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
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
          <div className={`rounded-lg border p-6 transition-colors ${
            isDark
              ? 'border-slate-800 bg-slate-900'
              : 'border-slate-200 bg-white'
          }`}>
            <div className={`mb-6 pb-6 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className={`text-2xl font-semibold font-bebas tracking-wide ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {order.code}
                </h2>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    order.status === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : order.status === 'REDEEMED'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : order.status === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  }`}
                >
                  {order.status === 'PENDING_PAYMENT'
                    ? 'Pago Pendiente'
                    : order.status === 'PAYMENT_REVIEW'
                      ? 'Revisión de Pago'
                      : order.status === 'PAID'
                        ? 'Listo para Retirar'
                        : order.status === 'REDEEMED'
                          ? 'Entregado'
                          : order.status === 'CANCELLED'
                            ? 'Cancelado'
                            : order.status}
                </span>
              </div>

              <div className={`grid gap-4 sm:grid-cols-2 text-sm ${
                isDark ? 'text-slate-400 font-slate-100' : 'text-slate-600 font-slate-900'
              }`}>
                <div>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Cliente</p>
                  <p className={`font-medium ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>{order.customerName}</p>
                </div>
                <div>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Teléfono</p>
                  <p className={`font-medium ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>{order.customerPhone}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className={`font-semibold mb-3 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>Productos</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between text-sm p-2 rounded border transition-colors ${
                    isDark
                      ? 'bg-slate-800/50 border-slate-800'
                      : 'bg-slate-100 border-slate-300'
                  }`}>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Producto ID: {item.productId}</span>
                    <span className={`font-medium ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className={`mb-6 pb-6 border-b transition-colors ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <p className={`font-semibold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>Total</p>
                <p className={`font-mono text-lg font-bold ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>

            {/* Acción */}
            {order.status === 'REDEEMED' ? (
              <div className={`rounded-lg border p-4 text-center transition-colors ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-100/50 border-emerald-300 text-emerald-700'
              }`}>
                Pedido ya entregado
              </div>
            ) : order.status === 'PAID' ? (
              <button
                onClick={handleDeliver}
                disabled={delivering}
                className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-6 py-2 font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {delivering ? 'Marcando como entregado...' : 'Marcar como Entregado'}
              </button>
            ) : order.status === 'CANCELLED' ? (
              <div className={`rounded-lg border p-4 text-center transition-colors ${
                isDark
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-red-100/50 border-red-300 text-red-700'
              }`}>
                Pedido cancelado
              </div>
            ) : (
              <div className={`rounded-lg border p-4 text-center transition-colors ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700 text-slate-300'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                Esperando pago o validación ({order.status})
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
