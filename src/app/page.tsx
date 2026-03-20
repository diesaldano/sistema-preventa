'use client';

import { useState } from 'react';
import { useProducts } from '@/lib/hooks';
import { useTheme } from '@/lib/theme-context';
import { ProductGrid } from '@/components/product-grid';
import { CartSummary } from '@/components/cart-summary';
import { BrandHeader } from '@/components/brand-header';

export default function Home() {
  const { products, loading, error, cacheHit } = useProducts();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const isDark = theme === 'dark';

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'cerveza', label: 'Cerveza' },
    { id: 'merch', label: 'Merch' },
    { id: 'entrada', label: 'Entrada' },
    { id: 'combo', label: 'Combos' },
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <main className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-950' : 'bg-white'
    }`}>
      {/* Brand Header */}
      <BrandHeader 
        event="AUTOS ROBADOS DIVA ROCK 2026"
        subtitle="Preventa oficial de bebidas"
      />

      {/* Filter Bar - Sticky */}
      <div className={`border-b sticky top-0 z-40 transition-colors ${
        isDark
          ? 'border-slate-800 bg-slate-950'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? isDark
                      ? 'bg-slate-700 text-white shadow-lg shadow-slate-700/30'
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : isDark
                    ? 'border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    : 'border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Container - Two Column Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-4">
          
          {/* PRODUCT GRID - 70-75% width (3 out of 4 columns) */}
          <div className="lg:col-span-3">
            <ProductGrid 
              products={filteredProducts} 
              loading={loading} 
              error={error} 
            />
          </div>

          {/* CART PANEL - 25-30% width (1 out of 4 columns) */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>

        </div>
      </div>
    </main>
  );
}
