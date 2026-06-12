export type Theme = 'ultra-dark' | 'light';

export const THEME_STORAGE_KEY = 'starlex-theme';
export const THEME_COOKIE_KEY = 'starlex-theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const DEFAULT_ACCENT = '#e6455a';

/** Migrate any stored/legacy value into the 2-theme contract. */
export function migrateTheme(value: string | null | undefined): Theme {
  if (value === 'light' || value === 'solarized') return 'light';
  // 'dark' | 'ultra-dark' | unknown | null → ultra-dark
  return 'ultra-dark';
}
