'use client';

import { Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { useTheme } from '@/lib/theme-context';

export function ProductGrid({ products, loading, error }: { products: Product[]; loading: boolean; error: string | null }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (error) {
    return (
      <div className={`rounded-xl border border-l-4 p-5 mb-8 transition-colors ${
        isDark
          ? 'border-blue-500/30 border-l-blue-500 bg-blue-500/10'
          : 'border-blue-400/30 border-l-blue-500 bg-blue-100/50'
      }`}>
        <p className={`font-semibold ${
          isDark ? 'text-blue-400' : 'text-blue-700'
        }`}>Aviso: Error al cargar productos</p>
        <p className={`text-sm mt-1 ${
          isDark ? 'text-blue-300/80' : 'text-blue-600/80'
        }`}>{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className={`h-8 w-40 animate-pulse rounded-lg ${
          isDark ? 'bg-slate-800' : 'bg-slate-300'
        }`} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`animate-pulse rounded-xl border p-6 aspect-square ${
                isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-300 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`rounded-xl border-2 border-dashed p-16 text-center ${
        isDark
          ? 'border-slate-800 bg-slate-900/50'
          : 'border-slate-300 bg-slate-100/50'
      }`}>
        <p className={`text-4xl mb-4 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>∅</p>
        <p className={`text-lg font-semibold ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>No hay productos en esta categoría</p>
        <p className={`text-sm mt-1 ${
          isDark ? 'text-slate-500' : 'text-slate-600'
        }`}>Intenta con otra categoría...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {products.length} {products.length === 1 ? 'Producto' : 'Productos'} Disponibles
        </h2>
        <p className={`text-sm mt-2 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>Elige tus bebidas para el evento</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
