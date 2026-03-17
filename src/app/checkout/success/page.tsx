'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <section className="text-center w-full">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center rounded-full bg-emerald-100 p-3">
            <svg
              className="h-8 w-8 text-emerald-600"
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

        <h1 className="text-3xl font-semibold text-foreground">
          ¡Pedido Creado!
        </h1>
        <p className="mt-2 text-muted">
          Tu pedido ha sido registrado correctamente
        </p>

        {code && (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm text-emerald-800">Tu código de retiro</p>
            <p className="mt-2 font-mono text-4xl font-bold text-emerald-900">
              {code}
            </p>
            <p className="mt-4 text-xs text-emerald-700">
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
              className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-6 py-3 text-sm font-medium text-foreground transition hover:bg-slate-50"
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
