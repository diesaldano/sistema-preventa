'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useTheme } from '@/lib/theme-context';
import { formatPrice } from '@/lib/utils';

// Obtener emoji según categoría
function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    cerveza: '🍺',
    fernet: '🥃',
    combinado: '🍹',
    default: '🍾',
  };
  return emojis[category.toLowerCase()] || emojis.default;
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { theme } = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
    });
    setQuantity(1);
    
    // Feedback visual
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleIncrement = () => setQuantity(q => q + 1);
  const handleDecrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const isOutOfStock = product.stock === 0;
  const emoji = getCategoryEmoji(product.category);
  const priceDisplay = formatPrice(product.price);

  const isDark = theme === 'dark';

  return (
    <div className={`
      group flex flex-col rounded-lg border transition-all duration-300 overflow-hidden h-full
      ${
        added 
          ? isDark
            ? 'border-emerald-500/50 bg-emerald-500/5 shadow-md'
            : 'border-emerald-400/40 bg-emerald-50 shadow-md'
          : isOutOfStock
          ? isDark
            ? 'border-slate-800 bg-slate-900/30 opacity-50'
            : 'border-slate-300 bg-slate-100/30 opacity-50'
          : isDark
          ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-1'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1'
      }
    `}>
      {/* Image Container - Square Aspect */}
      <div className={`relative aspect-square flex items-center justify-center overflow-hidden transition-colors ${
        isDark ? 'bg-slate-800/50' : 'bg-slate-100'
      }`}>
        <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
          {emoji}
        </span>
        
        {/* Stock Badge */}
        {isOutOfStock && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-black/40' : 'bg-white/40'
          }`}>
            <span className={`text-sm font-bold px-3 py-2 rounded-lg ${
              isDark ? 'text-white bg-black/60' : 'text-slate-900 bg-white/80'
            }`}>Agotado</span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${
            isDark
            ? 'bg-slate-950/80 text-slate-300 border-slate-700/50'
            : 'bg-white/80 text-slate-700 border-slate-200/50'
          }`}>
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4">
        {/* Product Name */}
        <h3 className={`font-bold text-base mb-1 line-clamp-2 ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {product.name}
        </h3>
        
        {/* Description */}
        <p className={`text-xs mb-3 line-clamp-2 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {product.description}
        </p>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Price Badge - Clean Design */}
        <div className={`mb-4 -mx-4 px-4 py-3 border-t border-b transition-colors ${
          isDark
            ? 'border-slate-800/50 bg-slate-800/20'
            : 'border-slate-200 bg-slate-50'
        }`}>
          <p className={`font-bold text-lg ${
            isDark ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'
          }`}>
            {priceDisplay}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={handleDecrement}
            disabled={quantity === 1 || isOutOfStock}
            className={`rounded-md border w-8 h-8 flex items-center justify-center font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            −
          </button>
          <span className={`w-6 text-center font-semibold text-sm ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            {quantity}
          </span>
          <button
            onClick={handleIncrement}
            disabled={isOutOfStock || quantity >= product.stock}
            className={`rounded-md border w-8 h-8 flex items-center justify-center font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`
            w-full rounded-md font-semibold transition-all duration-300 py-2.5 flex items-center justify-center gap-2 text-sm
            ${
              added
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-400'
                : isOutOfStock
                ? isDark
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : isDark
                ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-md hover:shadow-lg'
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-md hover:shadow-lg'
            }
          `}
        >
          {added ? '✓ Agregado' : 'Agregar'} →
        </button>

        {/* Stock Indicator */}
        <div className={`text-center text-xs mt-2 ${
          isDark ? 'text-slate-500' : 'text-slate-600'
        }`}>
          Stock: <span className={`font-bold ${
            isOutOfStock 
              ? isDark ? 'text-red-500' : 'text-red-600'
              : isDark ? 'text-slate-400' : 'text-slate-700'
          }`}>{product.stock}</span>
        </div>
      </div>
    </div>
  );
}
