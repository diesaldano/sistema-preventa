'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ToastContainer, ToastMessage } from '@/components/toast';

interface ToastContextType {
  messages: ToastMessage[];
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addMessage = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    title?: string,
    duration: number = 4000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setMessages((prev) => [
      ...prev,
      {
        id,
        type,
        title,
        message,
        duration,
      },
    ]);
  };

  const dismiss = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const success = (message: string, title?: string, duration?: number) => {
    addMessage(message, 'success', title, duration || 4000);
  };

  const error = (message: string, title?: string, duration?: number) => {
    addMessage(message, 'error', title || '❌ Error', duration || 5000);
  };

  const warning = (message: string, title?: string, duration?: number) => {
    addMessage(message, 'warning', title, duration || 4000);
  };

  const info = (message: string, title?: string, duration?: number) => {
    addMessage(message, 'info', title, duration || 4000);
  };

  return (
    <ToastContext.Provider
      value={{
        messages,
        success,
        error,
        warning,
        info,
        dismiss,
      }}
    >
      {children}
      <ToastContainer messages={messages} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Hook para usar toasts desde cualquier componente cliente
 * Uso: const toast = useToastContext();
 *      toast.success('¡Éxito!');
 */
export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext debe usarse dentro de <ToastProvider>');
  }
  return context;
}
