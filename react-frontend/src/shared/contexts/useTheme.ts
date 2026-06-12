import { useContext, useEffect } from 'react';
import { ThemeContext, type ThemeContextType } from './themeContext.js';
import { migrateTheme, THEME_STORAGE_KEY } from './themeConfig.js';

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

export function useSystemThemeOnly(): void {
  const { setTheme } = useTheme();
  useEffect(() => {
    const saved = migrateTheme(localStorage.getItem(THEME_STORAGE_KEY));
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(systemDark ? 'ultra-dark' : 'light');
    return () => { setTheme(saved); };
  }, [setTheme]);
}
