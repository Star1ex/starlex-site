import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext.js';

export const Appearance: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const themeOptions = [
    { id: 'light', label: 'White' },
    { id: 'dark', label: 'Dark Blue' },
    { id: 'ultra-dark', label: 'Ultra Dark' },
    { id: 'solarized', label: 'Solarized White' },
  ] as const;
  const previewThemes = [
    { id: 'light', label: 'White', bg: 'bg-white', surface: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', muted: 'text-gray-500' },
    { id: 'dark', label: 'Dark Blue', bg: 'bg-gray-900', surface: 'bg-[#0f172a]', border: 'border-gray-800', text: 'text-gray-100', muted: 'text-gray-400' },
    { id: 'ultra-dark', label: 'Ultra Dark', bg: 'bg-[#1e2124]', surface: 'bg-[#2f3136]', border: 'border-[#202225]', text: 'text-gray-100', muted: 'text-gray-400' },
    { id: 'solarized', label: 'Solarized White', bg: 'bg-[#fdf6e3]', surface: 'bg-[#f7f0dd]', border: 'border-[#e7e0cc]', text: 'text-[#586e75]', muted: 'text-[#657b83]' },
  ] as const;

  return (
    <div className="space-y-8 text-center max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          Appearance
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          Customize the application theme
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="space-y-4 text-left">
        <h4 className="font-medium text-gray-900 dark:text-dark-text">Theme</h4>
        <div className="flex flex-col gap-2">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-dark-text-muted">
              Current theme: <span className="font-medium text-gray-900 dark:text-dark-text">{themeOptions.find(t => t.id === theme)?.label}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
              Select a theme below
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id as any)}
              className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                theme === opt.id
                  ? 'bg-gray-100/70 dark:bg-dark-border/60 text-gray-900 dark:text-dark-text'
                  : 'text-gray-600 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-border/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previewThemes.map((preview) => (
          <div key={preview.id} className={`p-4 rounded-xl ${preview.bg}`}>
            <div className={`w-full h-24 rounded-lg mb-3 border ${preview.surface} ${preview.border}`} />
            <div className={`text-xs font-medium ${preview.text}`}>{preview.label}</div>
            <div className={`text-[11px] mt-0.5 ${preview.muted}`}>Preview palette</div>
          </div>
        ))}
      </div>

      {/* Additional Theme Settings */}
      <div className="space-y-3 text-left">
        <h4 className="font-medium text-gray-900 dark:text-dark-text">Display Options</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer py-1.5 rounded hover:bg-gray-50/70 dark:hover:bg-dark-border/30 transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 dark:border-dark-border accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-dark-text">Enable animations</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer py-1.5 rounded hover:bg-gray-50/70 dark:hover:bg-dark-border/30 transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 dark:border-dark-border accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-dark-text">Reduce motion</span>
          </label>
        </div>
      </div>
    </div>
  );
};
