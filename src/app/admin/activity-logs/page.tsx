'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { BrandHeader } from '@/components/brand-header';
import { UserHeader } from '@/components/user-header';

type ActivityLogEntry = {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  target: string | null;
  details: string | null;
  createdAt: string;
};

type ActionCount = {
  action: string;
  count: number;
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  order_validate: 'Validar Pedido',
  order_reject: 'Rechazar Pedido',
  order_redeem: 'Entregar Pedido',
  user_create: 'Crear Usuario',
  user_edit: 'Editar Usuario',
  user_delete: 'Eliminar Usuario',
  stock_adjust: 'Ajustar Stock',
};

const ACTION_COLORS: Record<string, { dark: string; light: string; bg_dark: string; bg_light: string }> = {
  login: { dark: 'text-emerald-400', light: 'text-emerald-700', bg_dark: 'bg-emerald-500/20', bg_light: 'bg-emerald-100' },
  logout: { dark: 'text-slate-400', light: 'text-slate-600', bg_dark: 'bg-slate-500/20', bg_light: 'bg-slate-200' },
  order_validate: { dark: 'text-green-400', light: 'text-green-700', bg_dark: 'bg-green-500/20', bg_light: 'bg-green-100' },
  order_reject: { dark: 'text-red-400', light: 'text-red-700', bg_dark: 'bg-red-500/20', bg_light: 'bg-red-100' },
  order_redeem: { dark: 'text-blue-400', light: 'text-blue-700', bg_dark: 'bg-blue-500/20', bg_light: 'bg-blue-100' },
  user_create: { dark: 'text-purple-400', light: 'text-purple-700', bg_dark: 'bg-purple-500/20', bg_light: 'bg-purple-100' },
  user_edit: { dark: 'text-amber-400', light: 'text-amber-700', bg_dark: 'bg-amber-500/20', bg_light: 'bg-amber-100' },
  user_delete: { dark: 'text-rose-400', light: 'text-rose-700', bg_dark: 'bg-rose-500/20', bg_light: 'bg-rose-100' },
  stock_adjust: { dark: 'text-cyan-400', light: 'text-cyan-700', bg_dark: 'bg-cyan-500/20', bg_light: 'bg-cyan-100' },
};

const DEFAULT_COLOR = { dark: 'text-slate-400', light: 'text-slate-600', bg_dark: 'bg-slate-700', bg_light: 'bg-slate-200' };

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function ActivityLogsPage() {
  const { theme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [actionCounts, setActionCounts] = useState<ActionCount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [filterAction, setFilterAction] = useState('ALL');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'ALL') params.set('action', filterAction);
      if (filterEmail) params.set('userEmail', filterEmail);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar logs');
      const json = await res.json();
      setLogs(json.data.logs);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setActionCounts(json.data.actionCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user, filterAction, filterEmail, filterDateFrom, filterDateTo, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (authLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <BrandHeader event="Activity Logs" subtitle="DIEZ PRODUCCIONES - Registro de Actividad" />
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

  function handleApplyFilters() {
    setPage(1);
    fetchLogs();
  }

  function handleClearFilters() {
    setFilterAction('ALL');
    setFilterEmail('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Activity Logs" subtitle="DIEZ PRODUCCIONES - Registro de Actividad" />

      <UserHeader
        email={user.email}
        role={user.role}
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className={`inline-flex items-center gap-2 text-sm font-medium transition ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
            ← Panel de Validación
          </Link>
          <Link href="/admin/analytics" className={`inline-flex items-center gap-2 text-sm font-medium transition ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>
            📊 Analytics
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {/* Action Summary Cards */}
        {actionCounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {actionCounts.map((ac) => {
              const colors = ACTION_COLORS[ac.action] || DEFAULT_COLOR;
              return (
                <button
                  key={ac.action}
                  onClick={() => { setFilterAction(filterAction === ac.action ? 'ALL' : ac.action); setPage(1); }}
                  className={`rounded-lg p-3 text-center transition-all cursor-pointer border ${
                    filterAction === ac.action
                      ? isDark ? 'border-white/30 ring-1 ring-white/20' : 'border-slate-900/30 ring-1 ring-slate-900/20'
                      : isDark ? 'border-slate-800' : 'border-slate-200'
                  } ${isDark ? colors.bg_dark : colors.bg_light}`}
                >
                  <p className={`text-xl font-bold ${isDark ? colors.dark : colors.light}`}>{ac.count}</p>
                  <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {ACTION_LABELS[ac.action] || ac.action}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className={`rounded-xl border p-4 mb-6 transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Acción</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
              >
                <option value="ALL">Todas</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="order_validate">Validar Pedido</option>
                <option value="order_reject">Rechazar Pedido</option>
                <option value="order_redeem">Entregar Pedido</option>
                <option value="user_create">Crear Usuario</option>
                <option value="user_edit">Editar Usuario</option>
                <option value="user_delete">Eliminar Usuario</option>
                <option value="stock_adjust">Ajustar Stock</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Usuario</label>
              <input
                type="text"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                placeholder="Email del usuario..."
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Desde</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
              />
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Hasta</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleApplyFilters} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              Aplicar Filtros
            </button>
            <button onClick={handleClearFilters} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
              Limpiar
            </button>
          </div>
        </div>

        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {total} registros
          {filterAction !== 'ALL' && ` · Filtro: ${ACTION_LABELS[filterAction] || filterAction}`}
        </p>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="inline-block mb-4 w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
              <p>Cargando actividad...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            No se encontraron registros de actividad
          </div>
        ) : (
          <div className="relative">
            <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            <div className="space-y-3">
              {logs.map((log) => {
                const colors = ACTION_COLORS[log.action] || DEFAULT_COLOR;
                return (
                  <div key={log.id} className="relative pl-10">
                    <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 ${isDark ? `${colors.bg_dark} border-slate-900` : `${colors.bg_light} border-white`}`} />
                    <div className={`rounded-lg border p-4 transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isDark ? `${colors.bg_dark} ${colors.dark}` : `${colors.bg_light} ${colors.light}`}`}>
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                            <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {log.userEmail}
                            </span>
                          </div>
                          {log.target && (
                            <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              Target: {log.target}
                            </p>
                          )}
                          {log.details && (
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              {log.details}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {getRelativeTime(log.createdAt)}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                            {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-30'}`}
            >
              ← Anterior
            </button>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-30'}`}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
