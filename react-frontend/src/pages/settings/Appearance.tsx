import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext.js';

const themeOptions = [
  {
    id: 'light',
    label: 'White',
    description: 'Clean and minimal',
    bg: '#ffffff',
    sidebar: '#f5f5f5',
    text: '#1a1a1a',
    accent: '#e8e8e8',
    card: '#fafafa',
  },
  {
    id: 'dark',
    label: 'Dark Blue',
    description: 'Easy on the eyes',
    bg: '#0d1b2a',
    sidebar: '#0a1622',
    text: '#e2e8f0',
    accent: '#1e3a5f',
    card: '#152234',
  },
  {
    id: 'ultra-dark',
    label: 'Ultra Dark',
    description: 'Pure darkness',
    bg: '#111113',
    sidebar: '#0b090a',
    text: '#e5e5e5',
    accent: '#222222',
    card: '#1a1a1c',
  },
  {
    id: 'solarized',
    label: 'Solarized',
    description: 'Warm and focused',
    bg: '#fdf6e3',
    sidebar: '#eee8d5',
    text: '#657b83',
    accent: '#ddd6c0',
    card: '#f5efdc',
  },
] as const;

function ThemePreview({ theme }: { theme: typeof themeOptions[number] }) {
  return (
    <div
      className="w-full rounded-md overflow-hidden"
      style={{ background: theme.bg, height: 88 }}
    >
      <div className="flex h-full">
        <div className="w-10 h-full flex-shrink-0 p-1.5 space-y-1" style={{ background: theme.sidebar }}>
          {[20, 14, 14, 14, 14].map((w, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{ background: theme.accent, height: 5, width: `${w}px`, opacity: i === 0 ? 0.9 : 0.5 }}
            />
          ))}
        </div>
        <div className="flex-1 p-2 space-y-1.5">
          <div className="rounded-sm" style={{ background: theme.text, height: 6, width: '60%', opacity: 0.7 }} />
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded"
                style={{ background: theme.card, border: `1px solid ${theme.accent}`, height: 30, flex: 1 }}
              />
            ))}
          </div>
          <div className="rounded-sm" style={{ background: theme.text, height: 5, width: '40%', opacity: 0.35 }} />
        </div>
      </div>
    </div>
  );
}

export const Appearance: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Theme</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose how TeamTrack looks on this device
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {themeOptions.map(opt => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id as Parameters<typeof setTheme>[0])}
              className="text-left rounded-xl p-3 transition-all duration-150"
              style={{
                background: isActive ? 'var(--bg-active)' : 'var(--bg-secondary)',
                border: `2px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                outline: 'none',
              }}
            >
              <ThemePreview theme={opt} />
              <div className="mt-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {opt.description}
                  </div>
                </div>
                {isActive && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent-blue)' }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
