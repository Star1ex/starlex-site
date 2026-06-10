import React, { useEffect, useState, ReactNode } from 'react';
import { getCookie, setCookie } from '@/shared/lib/cookies.js';
import { ThemeContext } from './themeContext.js';
import {
  DEFAULT_ACCENT,
  migrateTheme,
  THEME_COOKIE_KEY,
  THEME_COOKIE_MAX_AGE,
  THEME_STORAGE_KEY,
  type Theme,
} from './themeConfig.js';

function applyThemeClasses(theme: Theme) {
  const root = document.documentElement;
  // The contract switches on data-theme; the `dark` class is kept only so
  // Tailwind `dark:` variants and class-sniffing consumers (e.g. BlockNote)
  // keep working under ultra-dark.
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'ultra-dark');
}

function applyFavicon(theme: Theme) {
  const isDark = theme === 'ultra-dark';
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

function getAccentChannels(color: string): string {
  const value = color.trim();
  const hex = value.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];

  if (hex) {
    const normalized = hex.length === 3
      ? hex.split('').map((char) => `${char}${char}`).join('')
      : hex;
    const intValue = Number.parseInt(normalized, 16);
    const red = (intValue >> 16) & 255;
    const green = (intValue >> 8) & 255;
    const blue = intValue & 255;
    return `${red} ${green} ${blue}`;
  }

  const rgb = value.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/i);
  if (rgb) {
    return `${rgb[1]} ${rgb[2]} ${rgb[3]}`;
  }

  return '230 69 90';
}

function applyStarlexAccent(color: string) {
  const root = document.documentElement;
  const channels = getAccentChannels(color);

  root.style.setProperty('--starlex-accent', color);
  root.style.setProperty('--starlex-accent-rgb', channels);
  root.style.setProperty('--starlex-accent-soft', `rgb(${channels} / 0.14)`);
  root.style.setProperty('--starlex-accent-border', `rgb(${channels} / 0.32)`);
  root.style.setProperty('--workspace-accent', color);
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved =
      getCookie(THEME_COOKIE_KEY) ||
      localStorage.getItem(THEME_STORAGE_KEY);
    return migrateTheme(saved);
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
    setThemeState((prev) => (prev === 'light' ? 'ultra-dark' : 'light'));
  };

  const setAccent = (color: string) => {
    setAccentState(color);
    applyStarlexAccent(color);
  };

  const clearAccent = () => {
    setAccentState(DEFAULT_ACCENT);
    applyStarlexAccent(DEFAULT_ACCENT);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accent, setAccent, clearAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};
