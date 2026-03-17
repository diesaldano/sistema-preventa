'use client';

import { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
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

  return (
    <div className={`
      flex flex-col rounded-xl border transition-all duration-300 p-6 h-full
      ${
        added 
          ? 'border-emerald-500/50 bg-emerald-500/5 shadow-md' 
          : isOutOfStock
          ? 'border-slate-800 bg-slate-900/30 opacity-50'
          : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50 hover:scale-105'
      }
    `}>
      {/* Icono Grande Centrado */}
      <div className="flex justify-center mb-6 flex-grow items-center min-h-24">
        <span className="text-5xl">{emoji}</span>
      </div>

      {/* Nombre y Descripción */}
      <div className="mb-6 text-center">
        <h3 className="font-bold text-slate-100 text-lg mb-1">
          {product.name}
        </h3>
        <p className="text-sm text-slate-400">
          {product.description}
        </p>
      </div>

      {/* Separador */}
      <div className="border-t border-slate-800 my-4" />

      {/* Precio */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-amber-500">
          ${(product.price / 1000).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Separador */}
      <div className="border-t border-slate-800 my-4" />

      {/* Controles de Cantidad */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={handleDecrement}
          disabled={quantity === 1 || isOutOfStock}
          className="rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 flex items-center justify-center font-semibold text-slate-300 transition-colors"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold text-slate-100">
          {quantity}
        </span>
        <button
          onClick={handleIncrement}
          disabled={isOutOfStock || quantity >= product.stock}
          className="rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 flex items-center justify-center font-semibold text-slate-300 transition-colors"
        >
          +
        </button>
      </div>

      {/* Separador */}
      <div className="border-t border-slate-800 my-4" />

      {/* Botón Agregar */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`
          w-full rounded-lg font-semibold transition-all duration-300 py-3 mb-4 flex items-center justify-center gap-2
          ${
            added
              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-600'
              : isOutOfStock
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-amber-500 text-slate-950 hover:bg-amber-600 active:scale-95'
          }
        `}
      >
        {added ? '✓ Agregado' : 'Agregar al Carrito'} →
      </button>

      {/* Stock Badge */}
      <div className="text-center text-xs text-slate-400">
        Stock: <span className={isOutOfStock ? 'text-red-400 font-bold' : 'text-slate-300 font-semibold'}>{product.stock}</span>
      </div>
    </div>
  );
}
