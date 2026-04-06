'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const { login, isAuthenticated, isLoading, error: authError, user } = useAuth();
  const router = useRouter();

  // Redirigir según rol después de login exitoso
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'STAFF') {
        router.push('/despacho');
      }
    }
  }, [isAuthenticated, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError('');

    try {
      await login(email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
      {/* Login Card */}
      <div className="w-full max-w-md bg-gradient-to-br from-slate-950 via-black to-slate-900 rounded-lg shadow-2xl border border-slate-800/50 overflow-hidden">
        {/* Logo Header */}
        <div className="px-6 sm:px-8 py-8 border-b border-slate-800 flex items-center justify-center gap-4">
          {/* Diez Logo */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0">
            <Image
              src="/diez.png"
              alt="Diez Producciones"
              fill
              className="object-contain"
              sizes="(max-width: 640px) 64px, (max-width: 768px) 96px"
              priority
            />
          </div>
          
          {/* Divisor */}
          <div className="h-6 w-px bg-slate-700 sm:h-8"></div>
          
          {/* Salamanca Logo */}
          <div className="relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0">
            <Image
              src="/salamanca.png"
              alt="Salamanca"
              fill
              className="object-contain"
              sizes="(max-width: 640px) 56px, (max-width: 768px) 80px"
              priority
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="px-6 sm:px-8 py-8 sm:py-10">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Preventa System</h1>
            <p className="text-slate-400 text-sm">Ingresa tus credenciales para acceder</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@preventa.local"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all"
                disabled={isLoading}
                required
              />
            </div>

            {/* Error Message */}
            {(localError || authError) && (
              <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium">
                  ⚠️ {localError || authError}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-500 text-white font-bold rounded-lg transition-all duration-200 uppercase tracking-wide text-sm shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2">⏳</span> Ingresando...
                </span>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        {/* Footer with test credentials */}
        <div className="border-t border-slate-700 bg-slate-800/50 px-6 sm:px-8 py-6">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-4">
            🔐 Credenciales de Prueba:
          </p>
          <div className="space-y-2 text-xs">
            <div>
              <p className="text-amber-400 font-semibold">👨‍💼 Administrador:</p>
              <p className="text-slate-400">admin@preventa.local / admin123</p>
            </div>
            <div>
              <p className="text-blue-400 font-semibold">👷 Personal Despacho:</p>
              <p className="text-slate-400">staff1@preventa.local / staff123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
