'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, null = permanent
}

interface ToastContainerProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

interface ToastItemProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

/**
 * Icóno según tipo de notificación
 */
function getIcon(type: ToastType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '●';
  }
}

/**
 * Colores según tipo
 */
function getColors(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        icon: 'text-emerald-500',
        text: 'text-emerald-900 dark:text-emerald-100',
        title: 'text-emerald-900 dark:text-emerald-100',
      };
    case 'error':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        icon: 'text-red-500',
        text: 'text-red-900 dark:text-red-100',
        title: 'text-red-900 dark:text-red-100',
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        icon: 'text-amber-500',
        text: 'text-amber-900 dark:text-amber-100',
        title: 'text-amber-900 dark:text-amber-100',
      };
    case 'info':
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        icon: 'text-blue-500',
        text: 'text-blue-900 dark:text-blue-100',
        title: 'text-blue-900 dark:text-blue-100',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        icon: 'text-slate-500',
        text: 'text-slate-900 dark:text-slate-100',
        title: 'text-slate-900 dark:text-slate-100',
      };
  }
}

/**
 * Toast individual con auto-dismiss
 */
function ToastItem({ message, onDismiss }: ToastItemProps) {
  const colors = getColors(message.type);
  const icon = getIcon(message.type);

  useEffect(() => {
    if (message.duration && message.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(message.id);
      }, message.duration);

      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  return (
    <div
      className={`
        animate-in slide-in-from-right-full duration-300
        p-4 rounded-lg border backdrop-blur-sm
        ${colors.bg} ${colors.border}
        flex items-start gap-3 min-w-80 shadow-lg
      `}
    >
      {/* Icon */}
      <div className={`text-xl font-bold ${colors.icon} flex-shrink-0 mt-0.5`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {message.title && (
          <p className={`font-semibold ${colors.title}`}>
            {message.title}
          </p>
        )}
        <p className={`text-sm ${colors.text} ${message.title ? 'mt-1' : ''}`}>
          {message.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onDismiss(message.id)}
        className={`
          flex-shrink-0 text-lg font-bold opacity-50 hover:opacity-100
          transition-opacity ${colors.icon}
        `}
        aria-label="Cerrar notificación"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Toast Container - Renderiza todas las notificaciones
 * Posicionado en esquina inferior derecha
 */
export function ToastContainer({ messages, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {messages.map((message) => (
        <div key={message.id} className="pointer-events-auto">
          <ToastItem message={message} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/**
 * Hook para gestionar toasts
 * Uso: const toast = useToast();
 *      toast.success('¡Éxito!', 'Operación completada');
 */
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const add = (
    message: string,
    type: ToastType = 'info',
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
    add(message, 'success', title, duration);
  };

  const error = (message: string, title?: string, duration?: number) => {
    add(message, 'error', title || '❌ Error', duration);
  };

  const warning = (message: string, title?: string, duration?: number) => {
    add(message, 'warning', title, duration);
  };

  const info = (message: string, title?: string, duration?: number) => {
    add(message, 'info', title, duration);
  };

  return {
    messages,
    add,
    dismiss,
    success,
    error,
    warning,
    info,
  };
}
