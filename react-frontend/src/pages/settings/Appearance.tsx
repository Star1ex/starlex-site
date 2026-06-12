import React from 'react';
import { Check } from 'lucide-react';
import { useTheme } from '@/shared/contexts/useTheme.js';
import type { Theme } from '@/shared/contexts/themeConfig.js';

interface ThemeOption {
  id: Theme;
  label: string;
  description: string;
  /* Canonical contract values, mirrored for the preview chip. */
  canvas: string;
  surface: string;
  text: string;
  accent: string;
}

const themeOptions: readonly ThemeOption[] = [
  {
    id: 'ultra-dark',
    label: 'Ultra Dark',
    description: 'Pure darkness',
    canvas: '#08070a',
    surface: '#100f13',
    text: '#f4f2f0',
    accent: '#e6455a',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean and minimal',
    canvas: '#f4f5f7',
    surface: '#ffffff',
    text: '#16181d',
    accent: '#d63852',
  },
] as const;

function ThemePreview({ theme }: { theme: ThemeOption }) {
  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: theme.canvas, height: 88, borderRadius: 'var(--radius-md)' }}
    >
      <div className="flex h-full">
        <div
          className="w-10 h-full flex-shrink-0 p-1.5 space-y-1"
          style={{ background: theme.surface }}
        >
          {[20, 14, 14, 14, 14].map((w, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                background: i === 0 ? theme.accent : theme.text,
                height: 5,
                width: `${w}px`,
                opacity: i === 0 ? 0.95 : 0.4,
              }}
            />
          ))}
        </div>
        <div className="flex-1 p-2 space-y-1.5">
          <div className="rounded-sm" style={{ background: theme.text, height: 6, width: '60%', opacity: 0.72 }} />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ background: theme.surface, height: 30, flex: 1, borderRadius: 'var(--radius-sm)' }}
              />
            ))}
          </div>
          <div className="rounded-sm" style={{ background: theme.text, height: 5, width: '40%', opacity: 0.32 }} />
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
        <h3 className="text-base font-semibold mb-1 text-[color:var(--sx-text)]">Theme</h3>
        <p className="text-sm text-[color:var(--sx-text-muted)]">
          Choose how Starlex looks on this device
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {themeOptions.map((opt) => {
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              className="text-left p-3 transition-all duration-150"
              style={{
                borderRadius: 'var(--radius-lg)',
                background: isActive ? 'var(--sx-surface-active)' : 'var(--sx-surface)',
                border: `2px solid ${isActive ? 'var(--sx-accent)' : 'var(--sx-line)'}`,
                outline: 'none',
              }}
            >
              <ThemePreview theme={opt} />
              <div className="mt-2.5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[color:var(--sx-text)]">{opt.label}</div>
                  <div className="text-xs mt-0.5 text-[color:var(--sx-text-muted)]">{opt.description}</div>
                </div>
                {isActive && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--sx-accent)', color: 'var(--sx-accent-contrast)' }}
                  >
                    <Check className="w-3 h-3" strokeWidth={1.8} />
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
