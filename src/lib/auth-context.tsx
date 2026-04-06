/**
 * PHASE 4: Client Auth Context
 * Maneja JWT storage, refresh automation, y logout
 * Usa localStorage para persistencia entre sesiones
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos
  expiresAt: number; // timestamp ms
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

export interface AuthContextType {
  user: AuthUser | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';

/**
 * Provider component - envuelve la app para dar acceso al context
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<AuthToken | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurar token + user al montar el componente (localStorage)
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedToken = JSON.parse(storedToken) as AuthToken;
        const parsedUser = JSON.parse(storedUser) as AuthUser;

        // Verificar que token no esté expirado
        if (parsedToken.expiresAt > Date.now()) {
          setToken(parsedToken);
          setUser(parsedUser);
        } else {
          // Token expirado, limpiar
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Error parsing stored auth:', err);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  // Auto-refresh token 1 minuto antes de expirar
  useEffect(() => {
    if (!token) return;

    const now = Date.now();
    const expiresIn = token.expiresAt - now;
    const refreshBefore = 60 * 1000; // 1 minuto antes

    if (expiresIn < refreshBefore) {
      refreshToken();
      return;
    }

    const timeout = setTimeout(() => {
      refreshToken();
    }, expiresIn - refreshBefore);

    return () => clearTimeout(timeout);
  }, [token]);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      const newToken: AuthToken = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };

      setToken(newToken);
      setUser(data.user);

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newToken));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));

      setIsLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      setIsLoading(false);
      throw err;
    }
  }

  async function refreshToken() {
    if (!token) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });

      if (!res.ok) {
        // Refresh falló, logout
        await logout();
        return;
      }

      const data = await res.json();
      const newToken: AuthToken = {
        accessToken: data.accessToken,
        refreshToken: token.refreshToken, // Keep same refresh token
        expiresIn: data.expiresIn,
        expiresAt: Date.now() + data.expiresIn * 1000,
      };

      setToken(newToken);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newToken));
    } catch (err) {
      console.error('Token refresh failed:', err);
      await logout();
    }
  }

  async function logout() {
    if (!token) return;

    try {
      // Notificar al backend que estamos haciendo logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        }),
      }).catch(() => {
        // Ignorar errores de logout (ej: servidor caído)
      });
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshToken,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
