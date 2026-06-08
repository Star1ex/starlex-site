import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCookie, setCookie } from '@/shared/lib/cookies.js';

export type Theme = 'dark' | 'light' | 'ultra-dark' | 'solarized';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  accent: string;
  setAccent: (color: string) => void;
  clearAccent: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'starlex-theme';
const THEME_COOKIE_KEY = 'starlex-theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const DEFAULT_ACCENT = '#6366f1';

function applyThemeClasses(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light', 'theme-ultra-dark', 'theme-solarized');
  if (theme === 'dark')       root.classList.add('dark');
  if (theme === 'ultra-dark') root.classList.add('dark', 'theme-ultra-dark');
  if (theme === 'solarized')  root.classList.add('theme-solarized');
  if (theme === 'light')      root.classList.add('light');
}

function applyFavicon(theme: Theme) {
  const isDark = theme === 'dark' || theme === 'ultra-dark';
  const href = isDark ? '/favicon-white.png' : '/favicon.png';
  const link =
    document.querySelector<HTMLLinkElement>('#app-favicon') ||
    document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) {
    link.href = href;
    link.type = 'image/png';
  } else {
    const el = document.createElement('link');
    el.id = 'app-favicon';
    el.rel = 'icon';
    el.type = 'image/png';
    el.href = href;
    document.head.appendChild(el);
  }
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved =
      getCookie(THEME_COOKIE_KEY) ||
      localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'ultra-dark' || saved === 'solarized') {
      return saved;
    }
    // Default to dark (Liquid Glass) unless system prefers light
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
    return 'dark';
  });

  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    applyThemeClasses(theme);
    applyFavicon(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    setCookie(THEME_COOKIE_KEY, theme, { maxAge: THEME_COOKIE_MAX_AGE, path: '/' });
  }, [theme]);

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);

  const toggleTheme = () => {
    setThemeState((prev) => {
      switch (prev) {
        case 'dark':       return 'light';
        case 'light':      return 'ultra-dark';
        case 'ultra-dark': return 'solarized';
        default:           return 'dark';
      }
    });
  };

  const setAccent = (color: string) => {
    setAccentState(color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-blue', color);
  };

  const clearAccent = () => {
    setAccentState(DEFAULT_ACCENT);
    document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT);
    document.documentElement.style.setProperty('--accent-blue', DEFAULT_ACCENT);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accent, setAccent, clearAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

export function useSystemThemeOnly(): void {
  const { setTheme } = useTheme();
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'dark';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemDark ? 'dark' : 'light');
    return () => { setTheme(saved); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
