'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { BrandHeader } from '@/components/brand-header';
import { UserHeader } from '@/components/user-header';
import { formatPrice } from '@/lib/utils';

type ProductStock = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  available: boolean;
  sizes: string[];
  updatedAt: string;
};

type StockAlert = {
  id: string;
  name: string;
  stock: number;
  category: string;
  level: 'low_stock' | 'out_of_stock';
};

type Summary = {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStockThreshold: number;
  categories: string[];
};

export default function InventoryPage() {
  const { theme } = useTheme();
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [products, setProducts] = useState<ProductStock[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterSearch, setFilterSearch] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Stock adjustment
  const [adjustingProduct, setAdjustingProduct] = useState<ProductStock | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchInventory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inventory');
      if (!res.ok) throw new Error('Error al cargar inventario');
      const json = await res.json();
      setProducts(json.data.products);
      setSummary(json.data.summary);
      setAlerts(json.data.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  function clearMessages() {
    setError(null);
    setSuccessMsg(null);
  }

  async function handleStockAdjust() {
    if (!adjustingProduct) return;
    clearMessages();
    setSaving(true);

    const adj = parseInt(adjustmentValue);
    if (isNaN(adj) || adj === 0) {
      setError('Ingresá un número válido distinto de 0');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          adjustment: adj,
          reason: adjustmentReason || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al ajustar');

      const sign = adj >= 0 ? '+' : '';
      setSuccessMsg(`${adjustingProduct.name}: ${json.previousStock} → ${json.newStock} (${sign}${adj})`);
      setAdjustingProduct(null);
      setAdjustmentValue('');
      setAdjustmentReason('');
      fetchInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar stock');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
        <BrandHeader event="Inventory" subtitle="DIEZ PRODUCCIONES - Gestión de Inventario" />
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

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (filterCategory !== 'ALL' && p.category !== filterCategory) return false;
    if (filterSearch && !p.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    if (showOnlyLowStock && p.stock > (summary?.lowStockThreshold || 5)) return false;
    return true;
  });

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader event="Inventory" subtitle="DIEZ PRODUCCIONES - Gestión de Inventario" />

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

        {/* Messages */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300 mb-4">{error}</div>
        )}
        {successMsg && (
          <div className={`rounded-lg border p-4 mb-4 ${isDark ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-emerald-500/30 bg-emerald-50 text-emerald-700'}`}>
            {successMsg}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className={`rounded-xl border p-4 text-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{summary.totalProducts}</p>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Productos</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{summary.totalStock}</p>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Stock Total</p>
            </div>
            <div className={`rounded-xl border p-4 text-center cursor-pointer transition ${
              showOnlyLowStock
                ? isDark ? 'border-yellow-500/50 bg-yellow-500/10 ring-1 ring-yellow-500/30' : 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-400/30'
                : isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
            }`} onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}>
              <p className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>{summary.lowStockCount}</p>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Stock Bajo</p>
            </div>
            <div className={`rounded-xl border p-4 text-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>{summary.outOfStockCount}</p>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sin Stock</p>
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {alerts.length > 0 && (
          <div className={`rounded-xl border p-4 mb-6 ${isDark ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-yellow-300 bg-yellow-50'}`}>
            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
              Alertas de Stock
            </h3>
            <div className="flex flex-wrap gap-2">
              {alerts.map((a) => (
                <span
                  key={a.id}
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    a.level === 'out_of_stock'
                      ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                      : isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {a.name}: {a.stock} unidades
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={`rounded-xl border p-4 mb-6 transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Categoría</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'}`}
              >
                <option value="ALL">Todas</option>
                {summary?.categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Buscar Producto</label>
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Nombre del producto..."
                className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
              />
            </div>
          </div>
        </div>

        {/* Stock Adjustment Form */}
        {adjustingProduct && (
          <div className={`rounded-xl border p-5 mb-6 transition-colors ${isDark ? 'border-cyan-500/30 bg-slate-900' : 'border-cyan-300 bg-cyan-50'}`}>
            <h3 className={`text-base font-semibold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Ajustar Stock: {adjustingProduct.name}
            </h3>
            <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Stock actual: <span className="font-bold">{adjustingProduct.stock}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Ajuste (+/-)
                </label>
                <input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder="Ej: +10 o -5"
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={`text-xs font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Razón (opcional)
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ej: Reposición, Error de conteo, etc."
                  className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
                />
              </div>
            </div>
            {adjustmentValue && !isNaN(parseInt(adjustmentValue)) && parseInt(adjustmentValue) !== 0 && (
              <p className={`text-sm mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Resultado: {adjustingProduct.stock} → <span className="font-bold">{adjustingProduct.stock + parseInt(adjustmentValue)}</span>
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleStockAdjust}
                disabled={saving || !adjustmentValue}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isDark ? 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50' : 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50'}`}
              >
                {saving ? 'Ajustando...' : 'Aplicar Ajuste'}
              </button>
              <button
                onClick={() => { setAdjustingProduct(null); clearMessages(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className={`text-center ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="inline-block mb-4 w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
              <p>Cargando inventario...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            No se encontraron productos
          </div>
        ) : (
          <div className={`rounded-xl border overflow-hidden transition-colors ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'bg-slate-900' : 'bg-slate-50'}>
                    <th className={`text-left py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Producto</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Categoría</th>
                    <th className={`text-right py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Precio</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Stock</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Estado</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Talles</th>
                    <th className={`text-center py-3 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= (summary?.lowStockThreshold || 5) && p.stock > 0;
                    const isOut = p.stock <= 0;
                    return (
                      <tr
                        key={p.id}
                        className={`border-t transition ${
                          isDark
                            ? `border-slate-800 ${isOut ? 'bg-red-500/5' : isLow ? 'bg-yellow-500/5' : ''}`
                            : `border-slate-100 ${isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : ''}`
                        }`}
                      >
                        <td className={`py-3 px-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <p className="font-medium">{p.name}</p>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{p.description}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                            {p.category}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {formatPrice(p.price)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-lg font-bold ${
                            isOut
                              ? isDark ? 'text-red-400' : 'text-red-600'
                              : isLow
                              ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                              : isDark ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            !p.available
                              ? isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                              : isOut
                              ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'
                              : isLow
                              ? isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                              : isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {!p.available ? 'Deshabilitado' : isOut ? 'Sin Stock' : isLow ? 'Stock Bajo' : 'OK'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {p.sizes.length > 0 ? p.sizes.join(', ') : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => { setAdjustingProduct(p); setAdjustmentValue(''); setAdjustmentReason(''); clearMessages(); }}
                            className={`text-xs px-3 py-1.5 rounded font-medium transition ${
                              isDark
                                ? 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400'
                                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700'
                            }`}
                          >
                            Ajustar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
