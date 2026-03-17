interface BrandHeaderProps {
  event?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function BrandHeader({
  event = "Preventa DIVA ROCK 2025",
  subtitle = "Preventa oficial de bebidas",
  showLogo = true,
}: BrandHeaderProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-4">
          {showLogo && (
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
              DIEZ PRODUCCIONES
            </div>
          )}
          <div>
            <h1 className="font-bebas text-4xl md:text-5xl lg:text-6xl font-bold text-slate-100 tracking-tight">
              {event}
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-400 max-w-2xl">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
