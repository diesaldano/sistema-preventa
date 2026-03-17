'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';

export function CartSummary() {
  const { items, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-2xl mb-3">🛒</p>
        <p className="text-lg font-semibold text-slate-300 mb-2">Tu carrito está vacío</p>
        <p className="text-sm text-slate-400">Agrega productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-slate-900/50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🛒</span>
        <h2 className="font-bold text-slate-100 text-lg">Tu Carrito</h2>
      </div>

      {/* Separator */}
      <div className="border-t border-slate-800 mb-4" />

      {/* Items List */}
      <div className="space-y-2 mb-5 max-h-80 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-800/40 border border-slate-800 hover:bg-slate-800/60 transition"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-100 truncate text-sm">{item.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {item.quantity}x ${(item.price / 1000).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className="font-bold text-amber-500 ml-2 flex-shrink-0">
              ${((item.price * item.quantity) / 1000).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800 pt-4 mb-4">
        <div className="flex items-baseline justify-between">
          <p className="text-slate-400 font-medium text-sm">Total</p>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-500">
              ${(total / 1000).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">{items.length} artículo(s)</p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Link
        href="/checkout"
        className="block w-full rounded-lg bg-amber-500 hover:bg-amber-600 px-4 py-3 text-center font-semibold text-slate-950 transition-all hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 duration-200"
      >
        Checkout →
      </Link>

      {/* Secondary Info */}
      <p className="text-xs text-slate-500 text-center mt-3">
        Entrega en el evento 🎉
      </p>
    </div>
  );
}
