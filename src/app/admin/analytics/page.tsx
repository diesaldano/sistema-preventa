'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/utils';
import { BrandHeader } from '@/components/brand-header';
import { UserHeader } from '@/components/user-header';

type AnalyticsData = {
  totalOrders: number;
  ordersByStatus: {
    PENDING_PAYMENT: number;
    PAYMENT_REVIEW: number;
    PAID: number;
    REDEEMED: number;
    CANCELLED: number;
  };
  revenue: {
    confirmed: number;
    pending: number;
    total: number;
  };
  paymentSuccessRate: number;
  peakHours: Array<{ hour: number; count: number }>;
  productRanking: Array<{
    productId: string;
    name: string;
    category: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  recentOrders: Array<{
    code: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente',
  PAYMENT_REVIEW: 'En Revisión',
  PAID: 'Confirmado',
  REDEEMED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS_DARK: Record<string, string> = {
  PENDING_PAYMENT: 'text-yellow-400',
  PAYMENT_REVIEW: 'text-amber-400',
  PAID: 'text-emerald-400',
  REDEEMED: 'text-blue-400',
  CANCELLED: 'text-red-400',
};

const STATUS_COLORS_LIGHT: Record<string, string> = {
  PENDING_PAYMENT: 'text-yellow-700',
  PAYMENT_REVIEW: 'text-amber-700',
  PAID: 'text-emerald-700',
  REDEEMED: 'text-blue-700',
  CANCELLED: 'text-red-700',
};

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${suffix}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // CSV Export state
  const [exportStatus, setExportStatus] = useState('');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exportOrderStatus, setExportOrderStatus] = useState('ALL');
  const [exportCustomer, setExportCustomer] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) throw new Error('Error al cargar analytics');
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [user]);

  if (authLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <BrandHeader event="Analytics" subtitle="DIEZ PRODUCCIONES - Métricas y Reportes" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <div className="inline-block mb-4 w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
            <p>Verificando autenticación...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    setExportStatus('');
    try {
      const res = await fetch('/api/admin/export/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateFrom: exportDateFrom || undefined,
          dateTo: exportDateTo || undefined,
          status: exportOrderStatus !== 'ALL' ? exportOrderStatus : undefined,
          customer: exportCustomer || undefined,
        }),
      });

      if (!res.ok) throw new Error('Error al exportar');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportStatus('CSV descargado');
    } catch (err) {
      setExportStatus(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  // Find peak hour
  const peakHour = data?.peakHours?.[0];
  // Max count for bar chart scaling
  const maxHourCount = data?.peakHours ? Math.max(...data.peakHours.map((h) => h.count), 1) : 1;
  // Max daily revenue for bar chart scaling
  const maxDailyRevenue = data?.dailyRevenue
    ? Math.max(...data.dailyRevenue.map((d) => d.revenue), 1)
    : 1;

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Analytics & Reportes" subtitle="DIEZ PRODUCCIONES - Métricas en Tiempo Real" />

      <UserHeader
        email={user.email}
        role={user.role}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className={`inline-flex items-center gap-2 text-sm font-medium transition ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ← Panel de Validación
          </Link>
          <Link
            href="/admin/security-logs"
            className={`inline-flex items-center gap-2 text-sm font-medium transition ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ Security Logs
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="inline-block mb-4 w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
              <p>Cargando métricas...</p>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* === ROW 1: Revenue Cards === */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Confirmed Revenue */}
              <div className={`rounded-xl border p-6 transition-colors ${
                isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50'
              }`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  Ingresos Confirmados
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  {formatPrice(data.revenue.confirmed)}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                  Pagados + Entregados
                </p>
              </div>

              {/* Pending Revenue */}
              <div className={`rounded-xl border p-6 transition-colors ${
                isDark ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-yellow-300 bg-yellow-50'
              }`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  Ingresos Pendientes
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  {formatPrice(data.revenue.pending)}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                  En espera de validación
                </p>
              </div>

              {/* Total Revenue */}
              <div className={`rounded-xl border p-6 transition-colors ${
                isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}>
                <p className={`text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Total General
                </p>
                <p className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {formatPrice(data.revenue.total)}
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  Todos los pedidos
                </p>
              </div>
            </div>

            {/* === ROW 2: Order Stats + Payment Rate === */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Orders by Status */}
              <div className={`rounded-xl border p-6 transition-colors sm:col-span-2 lg:col-span-2 ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Pedidos por Estado ({data.totalOrders} total)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(Object.keys(data.ordersByStatus) as Array<keyof typeof data.ordersByStatus>).map((status) => (
                    <div key={status} className={`rounded-lg p-3 text-center ${
                      isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'
                    }`}>
                      <p className={`text-2xl font-bold ${isDark ? STATUS_COLORS_DARK[status] : STATUS_COLORS_LIGHT[status]}`}>
                        {data.ordersByStatus[status]}
                      </p>
                      <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {STATUS_LABELS[status]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Success Rate */}
              <div className={`rounded-xl border p-6 transition-colors ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Tasa de Éxito
                </h3>
                <div className="flex flex-col items-center justify-center">
                  {/* Circular progress indicator */}
                  <div className="relative w-28 h-28 mb-3">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke={isDark ? '#334155' : '#e2e8f0'}
                        strokeWidth="10"
                      />
                      <circle
                        cx="50" cy="50" r="42"
                        fill="none"
                        stroke={data.paymentSuccessRate >= 70 ? '#22c55e' : data.paymentSuccessRate >= 40 ? '#eab308' : '#ef4444'}
                        strokeWidth="10"
                        strokeDasharray={`${(data.paymentSuccessRate / 100) * 263.89} 263.89`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {data.paymentSuccessRate}%
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    De pagos resueltos
                  </p>
                </div>
              </div>
            </div>

            {/* === ROW 3: Daily Revenue Chart === */}
            <div className={`rounded-xl border p-6 transition-colors ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Ingresos Últimos 7 Días
              </h3>
              <div className="flex items-end gap-2 h-40">
                {data.dailyRevenue.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {day.revenue > 0 ? formatPrice(day.revenue) : '-'}
                    </span>
                    <div
                      className={`w-full rounded-t transition-all ${
                        isDark ? 'bg-blue-500' : 'bg-blue-500'
                      }`}
                      style={{
                        height: `${Math.max((day.revenue / maxDailyRevenue) * 100, day.revenue > 0 ? 4 : 0)}%`,
                        minHeight: day.revenue > 0 ? '4px' : '0px',
                      }}
                    />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      {formatDate(day.date)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      {day.orders}p
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* === ROW 4: Peak Hours + Product Ranking === */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Peak Hours */}
              <div className={`rounded-xl border p-6 transition-colors ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Horarios Pico
                </h3>
                {peakHour && peakHour.count > 0 && (
                  <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Mayor actividad: <span className="font-semibold">{formatHour(peakHour.hour)}</span> ({peakHour.count} pedidos)
                  </p>
                )}
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {data.peakHours
                    .filter((h) => h.count > 0)
                    .map((h) => (
                      <div key={h.hour} className="flex items-center gap-3">
                        <span className={`text-xs font-mono w-16 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {formatHour(h.hour)}
                        </span>
                        <div className="flex-1 h-5 relative">
                          <div
                            className={`h-full rounded transition-all ${
                              h.hour === peakHour?.hour
                                ? 'bg-orange-500'
                                : isDark ? 'bg-slate-700' : 'bg-slate-300'
                            }`}
                            style={{ width: `${(h.count / maxHourCount) * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono w-6 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {h.count}
                        </span>
                      </div>
                    ))}
                  {data.peakHours.filter((h) => h.count > 0).length === 0 && (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Sin datos de horarios
                    </p>
                  )}
                </div>
              </div>

              {/* Product Sales Ranking */}
              <div className={`rounded-xl border p-6 transition-colors ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Ranking de Productos
                </h3>
                {data.productRanking.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sin ventas registradas
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {data.productRanking.map((product, index) => (
                      <div
                        key={product.productId}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : index === 1
                            ? 'bg-slate-400/20 text-slate-400'
                            : index === 2
                            ? 'bg-orange-500/20 text-orange-500'
                            : isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {product.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {product.category} · {product.totalQuantity} unidades
                          </p>
                        </div>

                        {/* Revenue */}
                        <p className={`font-mono font-bold text-sm flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {formatPrice(product.totalRevenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* === ROW 5: Recent Orders === */}
            <div className={`rounded-xl border p-6 transition-colors ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Últimos Pedidos
              </h3>
              {data.recentOrders.length === 0 ? (
                <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Sin pedidos recientes
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Código</th>
                        <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cliente</th>
                        <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total</th>
                        <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Estado</th>
                        <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr key={order.code} className={`border-b last:border-b-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <td className={`py-2 px-2 font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {order.code}
                          </td>
                          <td className={`py-2 px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {order.customerName}
                          </td>
                          <td className={`py-2 px-2 text-right font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {formatPrice(order.total)}
                          </td>
                          <td className={`py-2 px-2 text-center text-xs font-semibold ${isDark ? STATUS_COLORS_DARK[order.status] : STATUS_COLORS_LIGHT[order.status]}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </td>
                          <td className={`py-2 px-2 text-right text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {formatDateTime(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* === ROW 6: Export Orders to CSV === */}
            <div className={`rounded-xl border p-6 transition-colors ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Exportar Pedidos a CSV
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Desde
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={(e) => setExportDateFrom(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={(e) => setExportDateTo(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Estado
                  </label>
                  <select
                    value={exportOrderStatus}
                    onChange={(e) => setExportOrderStatus(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="ALL">Todos</option>
                    <option value="PENDING_PAYMENT">Pendiente</option>
                    <option value="PAYMENT_REVIEW">En Revisión</option>
                    <option value="PAID">Confirmado</option>
                    <option value="REDEEMED">Entregado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={exportCustomer}
                    onChange={(e) => setExportCustomer(e.target.value)}
                    placeholder="Nombre o email..."
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                        : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  disabled={exporting}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                    isDark
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                  }`}
                >
                  {exporting ? 'Exportando...' : 'Descargar CSV'}
                </button>
                {exportStatus && (
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {exportStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
