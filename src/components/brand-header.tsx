'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme-context';

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
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`border-b transition-all duration-300 ${
      theme === 'light'
        ? 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100'
        : 'border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950'
    }`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="flex items-start justify-between gap-6">
          {/* Logo and Text */}
          <div className="flex-1 space-y-4">
            {showLogo && (
              <div className="inline-flex items-center gap-4">
                {/* Logos */}
                <div className="flex items-center gap-2">
                  {/* Diez Logo - Más grande */}
                  <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                    <Image
                      src={theme === 'light' ? '/diezb.png' : '/diez.png'}
                      alt="Diez Producciones"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  
                  {/* Divisor */}
                  <div className={`hidden md:block h-16 w-px ${
                    theme === 'light' ? 'bg-slate-300' : 'bg-slate-700'
                  }`} />
                  
                  {/* Salamanca Logo */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                    <Image
                      src={theme === 'light' ? '/salamancab.png' : '/salamanca.png'}
                      alt="Salamanca"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                
              </div>
            )}
            <div>
              <h1 className={`font-bebas text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight ${
                theme === 'light' ? 'text-slate-900' : 'text-slate-100'
              }`}>
                {event}
              </h1>
              <p className={`mt-2 text-sm md:text-base max-w-xl font-medium ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-400'
              }`}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`mt-2 p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-center ${
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
