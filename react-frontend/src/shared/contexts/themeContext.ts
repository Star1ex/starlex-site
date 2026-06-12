import { createContext } from 'react';
import type { Theme } from './themeConfig.js';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  accent: string;
  setAccent: (color: string) => void;
  clearAccent: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
