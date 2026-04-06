'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme-context';
import { EVENT_CONFIG } from '@/lib/constants';

interface BrandHeaderProps {
  event?: string; // Override event title if needed
  subtitle?: string; // Override subtitle if needed
  showLogo?: boolean;
  variant?: 'default' | 'compact'; // 'compact' for special pages (pedido, checkout, etc)
}

// Función para generar fecha actual en formato español
function getCurrentDateFormatted(): string {
  const today = new Date();
  const day = today.getDate();
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril',
    'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const month = months[today.getMonth()];
  return `${day} de ${month}`;
}

export function BrandHeader({
  event,
  subtitle,
  showLogo = true,
  variant = 'default',
}: BrandHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { band, venue, year, subtitle: defaultSubtitle } = EVENT_CONFIG;
  
  // ✅ NUEVO: Usar fecha dinámica como subtitle por defecto
  const currentDate = getCurrentDateFormatted();
  const displaySubtitle = subtitle !== undefined ? subtitle : defaultSubtitle;
  
  // Use custom title if provided, otherwise use configured event structure
  const hasCustomTitle = event !== undefined;

  return (
    <div className={`border-b transition-all duration-300 ${
      theme === 'light'
        ? 'border-slate-200'
        : 'border-slate-800'
    }`}
    style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/fotos/header.jpeg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Mobile: Vertical stack, Desktop: Horizontal flex */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
          {/* Logo and Text Container */}
          <div className="flex-1 space-y-2 sm:space-y-3 md:space-y-4">
            {showLogo && (
              <div className="inline-flex items-center gap-2 sm:gap-3 md:gap-4">
                {/* Logos */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Diez Logo - Responsivo */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 flex-shrink-0">
                    <Image
                      src="/diez.png"
                      alt="Diez Producciones"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 128px"
                      priority
                    />
                  </div>
                  
                  {/* Divisor */}
                  <div className={`hidden sm:block h-12 sm:h-14 md:h-16 w-px ${
                    theme === 'light' ? 'bg-slate-300' : 'bg-slate-700'
                  }`} />
                  
                  {/* Salamanca Logo - Visible en todos los breakpoints */}
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-20 md:h-20 flex-shrink-0">
                    <Image
                      src="/salamanca.png"
                      alt="Salamanca"
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, 80px"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Title - Responsive layout */}
            <div>
              {hasCustomTitle ? (
                // Custom title for special pages (pedido, checkout, etc)
                <h1 className="font-bebas text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                  {event}
                </h1>
              ) : (
                // Default event structure - Band / Venue • Year
                <div className="space-y-0.5 sm:space-y-1">
                  {/* Band name - always on one line */}
                  <h1 className="font-bebas text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                    {band}
                  </h1>
                  {/* Venue & Year - always on one line */}
                  <p className="font-bebas text-sm sm:text-lg md:text-3xl lg:text-4xl font-bold tracking-wide text-slate-300 leading-snug">
                    {venue} • {year}
                  </p>
                </div>
              )}
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base max-w-xl font-medium text-slate-200">
                {displaySubtitle}
              </p>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-center flex-shrink-0 ${
              theme === 'light'
                ? 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
                : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400'
            }`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.414 5.414a1 1 0 01.707.293l.707-.707a1 1 0 11-1.414-1.414l-.707.707a1 1 0 01-.293.414zM5 8a1 1 0 100-2H4a1 1 0 100 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
