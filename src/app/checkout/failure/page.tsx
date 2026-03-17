import Link from "next/link";

export default function FailurePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-amber-200 bg-amber-50 p-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-700">
          Error en el pedido
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-amber-900">
          El pedido no se pudo procesar
        </h1>
        <p className="mt-3 text-sm text-amber-800">
          Hubo un problema al registrar tu pedido. Por favor, intenta de nuevo.
        </p>

        <div className="mt-8">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            Intentar de Nuevo
          </Link>
        </div>
      </section>
    </main>
  );
}
