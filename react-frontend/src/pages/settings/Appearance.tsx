import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext.js';

export const Appearance: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

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
          <h4 className="font-medium text-gray-900 dark:text-dark-text">Dark Theme</h4>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-dark-text-muted">
                {theme === 'dark' ? 'Dark mode is enabled' : 'Light mode is enabled'}
              </p>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                Click the toggle to switch theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 transition-all duration-500 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-dark-surface"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle dark theme"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-yellow-400 shadow-md transform transition-all duration-500 ease-in-out flex items-center justify-center ${
                  theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.64 15.95c-.06-.3-.24-.58-.51-.76a7.5 7.5 0 1 1 4.73-6.88c.04.34.21.65.47.85.26.2.6.27.94.15.87-.32 1.59-1.03 1.92-1.95.14-.4.06-.81-.2-1.15-.82-1.16-2.07-2.01-3.51-2.3 1.13-.06 2.3.35 3.3 1.3 2.33 2.33 2.33 6.08 0 8.4-2.33 2.33-6.09 2.33-8.4 0-.93-.93-1.5-2.1-1.54-3.3.47-.17 1.01-.25 1.54-.2z" />
                  </svg>
                )}
              </div>
            </button>
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
