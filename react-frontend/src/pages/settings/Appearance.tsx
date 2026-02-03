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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          Appearance
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          Customize the application theme
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h4 className="font-medium text-gray-900 dark:text-dark-text">Theme</h4>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-dark-text-muted">
                Current theme: <span className="font-medium text-gray-900 dark:text-dark-text">{themeOptions.find(t => t.id === theme)?.label}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                Click the toggle to cycle themes
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-dark-surface"
              role="switch"
              aria-checked={theme !== 'light'}
              aria-label="Toggle theme"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-yellow-400 shadow-md transform transition-all duration-500 ease-in-out flex items-center justify-center ${
                  theme !== 'light' ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id as any)}
                className={`px-4 py-2 rounded-lg border text-sm text-left transition-colors ${
                  theme === opt.id
                    ? 'bg-gray-100 dark:bg-dark-border border-gray-300 dark:border-dark-border text-gray-900 dark:text-dark-text'
                    : 'bg-white dark:bg-dark-surface border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-muted hover:bg-gray-50 dark:hover:bg-dark-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-bg border-2 border-gray-200 dark:border-dark-border">
          <div className="w-full h-24 bg-white dark:bg-dark-surface rounded border border-gray-300 dark:border-dark-border mb-2" />
          <p className="text-xs text-gray-600 dark:text-dark-text-muted">Light Colors</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-900 dark:bg-dark-surface border-2 border-gray-800 dark:border-dark-border">
          <div className="w-full h-24 bg-gray-800 dark:bg-gray-700 rounded border border-gray-700 dark:border-gray-600 mb-2" />
          <p className="text-xs text-gray-400">Dark Colors</p>
        </div>
      </div>

      {/* Additional Theme Settings */}
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          <h4 className="font-medium text-gray-900 dark:text-dark-text">Display Options</h4>
        </div>
        <div className="px-6 py-4 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="w-4 h-4 rounded border-gray-300 dark:border-dark-border accent-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-dark-text">Enable animations</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
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
