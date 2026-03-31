import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext.js';

const themeOptions = [
  { id: 'light',      label: 'White' },
  { id: 'dark',       label: 'Dark Blue' },
  { id: 'ultra-dark', label: 'Ultra Dark' },
  { id: 'solarized',  label: 'Solarized White' },
] as const;

const swatchColors: Record<string, string> = {
  light:       '#ffffff',
  dark:        '#0a1929',
  'ultra-dark': '#0b090a',
  solarized:   '#fdf6e3',
};

export const Appearance: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Theme</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose how TeamTrack looks on this device
        </p>
      </div>
      <div className="space-y-1">
        {themeOptions.map(opt => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id as any)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-100 text-left"
              style={{
                background: isActive ? 'var(--bg-active)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 h-5 rounded-md border flex-shrink-0"
                  style={{
                    background: swatchColors[opt.id],
                    borderColor: 'var(--border-color)',
                  }}
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              {isActive && (
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
