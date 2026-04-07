'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { formatPrice } from '@/lib/utils';

export function CartSummary() {
  const { items, total, clearCart, removeItem } = useCart();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (items.length === 0) {
    return (
      <div className={`rounded-lg border-2 border-dashed p-6 text-center sticky top-24 transition-colors ${
        isDark
          ? 'border-slate-800 bg-slate-900/50'
          : 'border-slate-300 bg-slate-50'
      }`}>
        <p className="text-3xl mb-3">🛒</p>
        <p className={`text-base font-semibold mb-1 ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>Tu carrito está vacío</p>
        <p className={`text-xs ${
          isDark ? 'text-slate-500' : 'text-slate-600'
        }`}>Agrega bebidas para comenzar</p>
      </div>
    );
  }

  const priceDisplay = formatPrice(total);

  return (
    <div className={`rounded-lg border p-5 shadow-lg sticky top-24 transition-colors ${
      isDark
        ? 'border-slate-800 bg-slate-900 shadow-slate-900/30'
        : 'border-slate-200 bg-white shadow-slate-200/50'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🛒</span>
        <h2 className={`font-bold text-base ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>Tu Carrito</h2>
      </div>

      {/* Separator */}
      <div className={`border-t mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />

      {/* Items List */}
      <div className="space-y-2 mb-5 max-h-60 overflow-y-auto scrollbar-hide">
        {items.map((item) => {
          const itemTotalPrice = item.price * item.quantity;
          const itemKey = `${item.productId}-${item.size || 'no-size'}`;

          return (
            <div
              key={itemKey}
              className={`flex items-start justify-between text-xs p-3 rounded-md border transition-colors ${
                isDark
                  ? 'bg-slate-800/30 border-slate-800/50 hover:bg-slate-800/50'
                  : 'bg-slate-100 border-slate-200 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate text-sm ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>{item.name}</p>
                <div className={`mt-0.5 flex items-center gap-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-600'
                }`}>
                  <span>{item.quantity}x {formatPrice(item.price)}</span>
                  {/* Mostrar talle si existe */}
                  {item.size && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isDark
                        ? 'bg-blue-900/40 text-blue-300'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      Talle: {item.size}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <p className={`font-bold text-sm ${
                    isDark
                      ? 'text-amber-500 font-medium'
                      : 'text-amber-700 font-medium'
                }`}>
                  {formatPrice(itemTotalPrice)}
                </p>
                <button
                  onClick={() => removeItem(item.productId, item.size)}
                  className={`p-1 rounded transition-colors hover:bg-red-500/30 ${
                    isDark
                      ? 'text-slate-400 hover:text-red-400'
                      : 'text-slate-600 hover:text-red-600'
                  }`}
                  title="Eliminar del carrito"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className={`border-t pt-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-baseline justify-between">
          <p className={`font-medium text-xs ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>Total</p>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              isDark ? 'text-amber-500' : 'text-amber-600'
            }`}>
              {priceDisplay}
            </p>
            <p className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-500' : 'text-slate-600'
            }`}>{items.length} artículos</p>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Link
        href="/pagar"
        className={`block w-full rounded-md px-3 py-2.5 text-center font-semibold transition-all hover:shadow-lg active:scale-95 duration-200 text-sm mb-2 ${
          isDark
            ? 'bg-slate-800 hover:bg-slate-700 text-white hover:shadow-slate-800/30'
            : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-slate-900/30'
        }`}
      >
        Ir a Pagar →
      </Link>

      {/* Clear Cart Button */}
      <button
        onClick={clearCart}
        className={`w-full rounded-md border px-3 py-2 text-center font-medium transition-all duration-200 text-xs ${
          isDark
            ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
            : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        Limpiar carrito
      </button>

      {/* Info */}
      <p className={`text-xs text-center mt-3 leading-relaxed ${
        isDark ? 'text-slate-500' : 'text-slate-600'
      }`}>
        Entrega en el evento 🎉
      </p>
    </div>
  );
}
