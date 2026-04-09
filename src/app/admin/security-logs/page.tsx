'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { BrandHeader } from '@/components/brand-header';
import { UserHeader } from '@/components/user-header';

type SecurityLog = {
  id: string;
  clientIp: string;
  email: string;
  reason: string;
  details: string | null;
  createdAt: string;
};

type ReasonCount = {
  reason: string;
  count: number;
};

const REASON_LABELS: Record<string, string> = {
  invalid_input: 'Input Inválido',
  duplicate: 'Duplicado',
  rate_limit: 'Rate Limit',
  fraud: 'Fraude',
  stock_issue: 'Sin Stock',
  login_attempt_failed: 'Login Fallido',
};

const REASON_COLORS: Record<string, { dark: string; light: string; bg_dark: string; bg_light: string }> = {
  invalid_input: { dark: 'text-yellow-400', light: 'text-yellow-700', bg_dark: 'bg-yellow-500/20', bg_light: 'bg-yellow-100' },
  duplicate: { dark: 'text-blue-400', light: 'text-blue-700', bg_dark: 'bg-blue-500/20', bg_light: 'bg-blue-100' },
  rate_limit: { dark: 'text-orange-400', light: 'text-orange-700', bg_dark: 'bg-orange-500/20', bg_light: 'bg-orange-100' },
  fraud: { dark: 'text-red-400', light: 'text-red-700', bg_dark: 'bg-red-500/20', bg_light: 'bg-red-100' },
  stock_issue: { dark: 'text-purple-400', light: 'text-purple-700', bg_dark: 'bg-purple-500/20', bg_light: 'bg-purple-100' },
  login_attempt_failed: { dark: 'text-rose-400', light: 'text-rose-700', bg_dark: 'bg-rose-500/20', bg_light: 'bg-rose-100' },
};

const DEFAULT_REASON_COLOR = { dark: 'text-slate-400', light: 'text-slate-600', bg_dark: 'bg-slate-700', bg_light: 'bg-slate-200' };

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

export default function SecurityLogsPage() {
  const { theme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [reasonCounts, setReasonCounts] = useState<ReasonCount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterReason, setFilterReason] = useState('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterIp, setFilterIp] = useState('');

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
      if (filterReason !== 'ALL') params.set('reason', filterReason);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo);
      if (filterEmail) params.set('email', filterEmail);
      if (filterIp) params.set('ip', filterIp);
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/admin/security-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar logs');
      const json = await res.json();

      setLogs(json.data.logs);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setReasonCounts(json.data.reasonCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user, filterReason, filterDateFrom, filterDateTo, filterEmail, filterIp, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleExportCSV() {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/security-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: filterReason !== 'ALL' ? filterReason : undefined,
          dateFrom: filterDateFrom || undefined,
          dateTo: filterDateTo || undefined,
          email: filterEmail || undefined,
          ip: filterIp || undefined,
        }),
      });

      if (!res.ok) throw new Error('Error al exportar');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  if (authLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <BrandHeader event="Security Logs" subtitle="DIEZ PRODUCCIONES - Registros de Seguridad" />
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
    setFilterReason('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterEmail('');
    setFilterIp('');
    setPage(1);
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Security Logs" subtitle="DIEZ PRODUCCIONES - Registros de Seguridad" />

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
            href="/admin/analytics"
            className={`inline-flex items-center gap-2 text-sm font-medium transition ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Analytics
          </Link>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-6">
            {error}
          </div>
        )}

        {/* Reason Summary Cards */}
        {reasonCounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {reasonCounts.map((rc) => {
              const colors = REASON_COLORS[rc.reason] || DEFAULT_REASON_COLOR;
              return (
                <button
                  key={rc.reason}
                  onClick={() => {
                    setFilterReason(filterReason === rc.reason ? 'ALL' : rc.reason);
                    setPage(1);
                  }}
                  className={`rounded-lg p-3 text-center transition-all cursor-pointer border ${
                    filterReason === rc.reason
                      ? isDark
                        ? 'border-white/30 ring-1 ring-white/20'
                        : 'border-slate-900/30 ring-1 ring-slate-900/20'
                      : isDark
                      ? 'border-slate-800'
                      : 'border-slate-200'
                  } ${isDark ? colors.bg_dark : colors.bg_light}`}
                >
                  <p className={`text-xl font-bold ${isDark ? colors.dark : colors.light}`}>
                    {rc.count}
                  </p>
                  <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {REASON_LABELS[rc.reason] || rc.reason}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className={`rounded-xl border p-4 mb-6 transition-colors ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Reason filter */}
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Razón
              </label>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                } border`}
              >
                <option value="ALL">Todas</option>
                <option value="invalid_input">Input Inválido</option>
                <option value="duplicate">Duplicado</option>
                <option value="rate_limit">Rate Limit</option>
                <option value="fraud">Fraude</option>
                <option value="stock_issue">Sin Stock</option>
                <option value="login_attempt_failed">Login Fallido</option>
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Desde
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                } border`}
              />
            </div>

            {/* Date to */}
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hasta
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                } border`}
              />
            </div>

            {/* Email */}
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Email
              </label>
              <input
                type="text"
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                placeholder="Buscar email..."
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                } border`}
              />
            </div>

            {/* IP */}
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                IP
              </label>
              <input
                type="text"
                value={filterIp}
                onChange={(e) => setFilterIp(e.target.value)}
                placeholder="Buscar IP..."
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600'
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                } border`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleApplyFilters}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Aplicar Filtros
            </button>
            <button
              onClick={handleClearFilters}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Limpiar
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className={`ml-auto px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isDark
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
              }`}
            >
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {total} registros encontrados
          {filterReason !== 'ALL' && ` · Filtro: ${REASON_LABELS[filterReason] || filterReason}`}
        </p>

        {/* Timeline / Log list */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="inline-block mb-4 w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
              <p>Cargando logs...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${
            isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}>
            No se encontraron registros de seguridad
          </div>
        ) : (
          <div className="relative">
            {/* Visual timeline line */}
            <div className={`absolute left-4 top-0 bottom-0 w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />

            <div className="space-y-3">
              {logs.map((log) => {
                const colors = REASON_COLORS[log.reason] || DEFAULT_REASON_COLOR;
                return (
                  <div key={log.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 ${
                      isDark
                        ? `${colors.bg_dark} border-slate-900`
                        : `${colors.bg_light} border-white`
                    }`} />

                    <div className={`rounded-lg border p-4 transition-colors ${
                      isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              isDark ? `${colors.bg_dark} ${colors.dark}` : `${colors.bg_light} ${colors.light}`
                            }`}>
                              {REASON_LABELS[log.reason] || log.reason}
                            </span>
                            <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {log.clientIp}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {log.email}
                          </p>
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
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-30'
              }`}
            >
              ← Anterior
            </button>
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-30'
              }`}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
