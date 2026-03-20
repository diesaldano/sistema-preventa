'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Aplicar tema al cargar la página
  useEffect(() => {
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem('preventa-theme') as Theme | null;
    const initialTheme = savedTheme || 'light';
    
    setTheme(initialTheme);
    
    // Aplicar inmediatamente
    if (initialTheme === 'light') {
      htmlElement.classList.add('light');
      htmlElement.classList.remove('dark');
    } else {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    }
    
    setMounted(true);
  }, []);

  // Actualizar cuando cambia el tema
  useEffect(() => {
    if (!mounted) return;
    
    const htmlElement = document.documentElement;
    
    // Guardar en localStorage
    localStorage.setItem('preventa-theme', theme);
    
    // Aplicar clases y estilos
    if (theme === 'light') {
      htmlElement.classList.add('light');
      htmlElement.classList.remove('dark');
    } else {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
