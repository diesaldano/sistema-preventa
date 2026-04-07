'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTheme } from '@/lib/theme-context';

function SuccessContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <main className={`mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12 transition-colors ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <section className="text-center w-full">
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center rounded-full p-3 transition-colors ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
            <svg
              className={`h-8 w-8 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          ¡Pedido Creado!
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Tu pedido ha sido registrado correctamente
        </p>

        {code && (
          <div className={`mt-8 rounded-xl border p-6 transition-colors ${isDark ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'}`}>
            <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Tu código de retiro</p>
            <p className={`mt-2 font-mono text-4xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
              {code}
            </p>
            <p className={`mt-4 text-xs ${isDark ? 'text-amber-300/70' : 'text-amber-700'}`}>
              Guarda este código para retirar tu pedido el día del evento
            </p>
          </div>
        )}

        {/* ⚠️ ALERTA URGENTE: Comprobante obligatorio */}
        <div className={`mt-8 rounded-xl border-2 p-6 transition-all ${
          isDark
            ? 'border-red-500/80 bg-red-600/30 shadow-lg shadow-red-600/20'
            : 'border-red-500 bg-red-100/50 shadow-lg shadow-red-400/30'
        }`}>
          <p className={`font-bold text-lg mb-2 ${isDark ? 'text-red-100' : 'text-red-900'}`}>
            ⚠️ IMPORTANTE: Tu Comprobante es Obligatorio
          </p>
          <p className={`text-sm mb-4 ${isDark ? 'text-red-200/90' : 'text-red-800/90'}`}>
            En el siguiente paso, debes subir tu comprobante de pago. Sin esto, nuestro equipo NO podrá validar tu pago.
          </p>
          <p className={`text-xs ${isDark ? 'text-red-300/70' : 'text-red-700/70'}`}>
            Tendrás el código de tu transferencia + pantalla del comprobante
          </p>
        </div>

        {/* ÚNICO botón: Ver mi Pedido (prominente) */}

        {/* ÚNICO botón: Ver mi Pedido (prominente) */}
        <div className="mt-8">
          {code && (
            <Link
              href={`/pedido/${code}`}
              className={`block w-full py-4 px-6 text-lg font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
                isDark
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-emerald-600/50'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:shadow-emerald-500/50'
              }`}
            >
              ✅ Ir a mi Pedido (Subir Comprobante)
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
