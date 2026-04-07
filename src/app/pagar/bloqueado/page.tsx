'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/lib/theme-context';
import { BrandHeader } from '@/components/brand-header';
import { AlertCircle, Clock, ArrowLeft } from 'lucide-react';

export default function BlockedPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 1 hora en segundos
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  useEffect(() => {
    // Calcular cuándo se desbloqueará (1 hora desde ahora)
    // En producción, esto vendría del servidor en la respuesta 429
    const now = new Date();
    const until = new Date(now.getTime() + 3600 * 1000);
    setBlockedUntil(until);

    // Countdown timer
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((until.getTime() - new Date().getTime()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <main className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
      <BrandHeader 
        event="Acceso Temporal Bloqueado" 
        subtitle="Preventa oficial de bebidas"
      />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className={`rounded-lg border-2 p-8 transition-colors ${
          isDark
            ? 'border-red-500/30 bg-slate-900'
            : 'border-red-300 bg-red-50'
        }`}>
          {/* ICONO + TÍTULO */}
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle 
              size={40} 
              className={isDark ? 'text-red-400 flex-shrink-0' : 'text-red-600 flex-shrink-0'}
            />
            <div>
              <h1 className={`text-2xl font-bold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Acceso Temporal Bloqueado
              </h1>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Hemos detectado múltiples intentos de compra en un corto período
              </p>
            </div>
          </div>

          {/* EXPLICACIÓN */}
          <div className={`rounded-lg p-4 mb-6 transition-colors ${
            isDark
              ? 'bg-slate-800/50 border border-slate-700'
              : 'bg-slate-100 border border-slate-300'
          }`}>
            <h2 className={`font-semibold mb-3 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              ¿Por qué pasó esto?
            </h2>
            <ul className={`space-y-2 text-sm ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">→</span>
                <span>Se detectaron múltiples intentos de crear órdenes desde tu cuenta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">→</span>
                <span>Como medida de seguridad, hemos bloqueado crear nuevas órdenes temporalmente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold mt-0.5">→</span>
                <span>El acceso se restaurará automáticamente en:</span>
              </li>
            </ul>
          </div>

          {/* COUNTDOWN */}
          <div className={`rounded-lg p-6 mb-6 border-2 transition-colors ${
            isDark
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-amber-400 bg-amber-50'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock className={isDark ? 'text-amber-400' : 'text-amber-600'} size={28} />
              <p className={`text-sm font-medium ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                Tiempo restante:
              </p>
            </div>
            <div className={`text-center text-4xl font-mono font-bold mb-2 ${
              isDark ? 'text-amber-300' : 'text-amber-700'
            }`}>
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className={`text-xs text-center ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {hours > 0 && `${hours} hora${hours !== 1 ? 's' : ''} y `}
              {minutes} minuto{minutes !== 1 ? 's' : ''}
            </p>
          </div>

          {/* INSTUCCIONES */}
          <div className={`rounded-lg p-4 mb-6 transition-colors ${
            isDark
              ? 'bg-blue-500/10 border border-blue-500/30'
              : 'bg-blue-50 border border-blue-300'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              isDark ? 'text-blue-400' : 'text-blue-700'
            }`}>
              ¿Qué puedo hacer?
            </h3>
            <ul className={`text-sm space-y-2 ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>
              <li>✓ Ver tus órdenes existentes</li>
              <li>✓ Contactar a soporte si crees que es un error</li>
              <li>✓ Esperar a que se restaure el acceso automáticamente</li>
            </ul>
          </div>

          {/* BOTONES */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-600 hover:bg-slate-700 text-white'
              }`}
            >
              <ArrowLeft size={18} />
              Volver a Tienda
            </Link>
            <a
              href="mailto:info@diezproducciones.com"
              className={`flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition ${
                isDark
                  ? 'border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-slate-200'
                  : 'border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Contactar Soporte
            </a>
          </div>

          {/* NOTA ADICIONAL */}
          <div className={`mt-6 p-3 rounded text-xs border ${
            isDark
              ? 'border-slate-700 bg-slate-800/30 text-slate-400'
              : 'border-slate-300 bg-slate-100 text-slate-600'
          }`}>
            <p className="font-medium mb-1">⚠️ Información de seguridad:</p>
            <p>Este bloqueo es automático y forma parte de nuestro sistema de protección contra el fraude. Si no reconoces esta actividad, por favor contacta a soporte inmediatamente.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
