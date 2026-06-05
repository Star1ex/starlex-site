import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCookie, setCookie } from '@/shared/lib/cookies.js';

export type Theme = 'light' | 'dark' | 'ultra-dark' | 'solarized';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'starlex-theme';
const THEME_COOKIE_KEY = 'starlex-theme';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const LIGHT_FAVICON = '/favicon.png';
const DARK_FAVICON = '/favicon-white.png';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedCookie = getCookie(THEME_COOKIE_KEY);
    if (savedCookie === 'dark' || savedCookie === 'light' || savedCookie === 'ultra-dark' || savedCookie === 'solarized') {
      return savedCookie;
    }
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'ultra-dark' || saved === 'solarized') {
      return saved as Theme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('dark', 'theme-ultra-dark', 'theme-solarized');

    if (theme === 'dark') {
      root.classList.add('dark');
    }
    if (theme === 'ultra-dark') {
      root.classList.add('dark', 'theme-ultra-dark');
    }
    if (theme === 'solarized') {
      root.classList.add('theme-solarized');
    }

    const isDarkTheme = theme === 'dark' || theme === 'ultra-dark';
    const faviconHref = isDarkTheme ? DARK_FAVICON : LIGHT_FAVICON;
    const faviconLink =
      document.querySelector<HTMLLinkElement>('#app-favicon') ||
      document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (faviconLink) {
      faviconLink.href = faviconHref;
      faviconLink.type = 'image/png';
    } else {
      const link = document.createElement('link');
      link.id = 'app-favicon';
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = faviconHref;
      document.head.appendChild(link);
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
    setCookie(THEME_COOKIE_KEY, theme, { maxAge: THEME_COOKIE_MAX_AGE, path: '/' });
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      switch (prev) {
        case 'light': return 'dark';
        case 'dark': return 'ultra-dark';
        case 'ultra-dark': return 'solarized';
        default: return 'light';
      }
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Forces light/dark based on system preference while the calling component is mounted.
 * Restores the user's saved theme on unmount.
 * Use this on public pages (landing, login, signup).
 */
export function useSystemThemeOnly(): void {
  const { setTheme } = useTheme();

  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'light';
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemDark ? 'dark' : 'light');

    return () => {
      // Restore user's actual theme when leaving the page
      setTheme(savedTheme);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
