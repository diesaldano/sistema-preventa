'use client';

import { useState } from 'react';
import { useProducts } from '@/lib/hooks';
import { ProductCard } from '@/components/product-card';
import { CartSummary } from '@/components/cart-summary';
import { BrandHeader } from '@/components/brand-header';

export default function Home() {
  const { products, loading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'cerveza', label: 'Cerveza' },
    { id: 'fernet', label: 'Fernet' },
    { id: 'combinado', label: 'Combinados' },
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Brand Header */}
      <BrandHeader 
        event="Preventa DIVA ROCK 2025"
        subtitle="Preventa oficial de bebidas"
      />

      {/* Filter Bar */}
      <div className="border-b border-slate-800 bg-slate-950 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Catálogo - Productos (2 Columnas) */}
          <div className="lg:col-span-2">
            {error && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 mb-8 border-l-4 border-l-amber-500">
                <p className="font-semibold text-amber-400">Aviso: Error al cargar productos</p>
                <p className="text-sm mt-1 text-amber-300/80">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-800" />
                <div className="grid gap-6 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl border border-slate-800 bg-slate-900 p-6 aspect-square"
                    />
                  ))}
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 p-16 text-center">
                <p className="text-4xl text-slate-600 mb-4">∅</p>
                <p className="text-lg font-semibold text-slate-300">No hay productos en esta categoría</p>
                <p className="text-sm text-slate-500 mt-1">Intenta con otra categoría...</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-100">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'Producto' : 'Productos'} Disponibles
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Carrito Sticky - Columna 3 */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
