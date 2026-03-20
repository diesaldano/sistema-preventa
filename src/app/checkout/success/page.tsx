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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Volver al Inicio
          </Link>
          {code && (
            <Link
              href={`/pedido/${code}`}
              className={`inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'}`}
            >
              Ver mi Pedido
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
