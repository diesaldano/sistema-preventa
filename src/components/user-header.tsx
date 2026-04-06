'use client';

import { useTheme } from '@/lib/theme-context';

interface UserHeaderProps {
  email: string;
  role: 'ADMIN' | 'STAFF';
  isLoggingOut?: boolean;
  onLogout: () => void;
}

export function UserHeader({ 
  email, 
  role,
  isLoggingOut = false,
  onLogout 
}: UserHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const roleLabel = role === 'ADMIN' ? 'Administrador' : 'Staff de Despacho';

  return (
    <div className={`border-b transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
        {/* Left: User Info */}
        <div className="flex items-center gap-3">
          {/* Avatar Circle */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-slate-800' : 'bg-slate-200'
          }`}>
            <span className={`text-sm font-semibold ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {email.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Email & Role */}
          <div>
            <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {email}
            </p>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Right: Logout Button */}
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isDark
              ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 disabled:opacity-50'
              : 'bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50'
          }`}
        >
          {isLoggingOut ? 'Saliendo...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
