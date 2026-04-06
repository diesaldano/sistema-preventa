'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  size?: string;  // Talle seleccionado (ej: "M", "L", "XL") - solo para remeras
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Cargar carrito del localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('preventa-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
    setMounted(true);
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('preventa-cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      // Buscar item existente: MISMO productId Y MISMO talle
      const existingItem = prevItems.find(
        (item) => item.productId === newItem.productId && item.size === newItem.size
      );
      if (existingItem) {
        // Si existe, sumar cantidad
        return prevItems.map((item) =>
          item.productId === newItem.productId && item.size === newItem.size
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      // Si no existe, agregar como item nuevo (permite múltiples tallas del mismo producto)
      return [...prevItems, newItem];
    });
  };

  const removeItem = (productId: string, size?: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.productId === productId && item.size === size)
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeItem(productId, size);
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
