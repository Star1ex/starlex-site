import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '@/shared/lib/authManager.js';
import { useTheme } from '@/shared/contexts/ThemeContext.js';

const CONTRIBUTING_CONTENT = `# Contributing to TeamTrack

Thank you for your interest in contributing to TeamTrack! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, or pnpm
- Git

### Setup

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Start the development server: \`npm run dev\`

## Development Guidelines

### Code Style

- Follow the existing code style and conventions
- Use TypeScript for type safety
- Write clean, readable, and maintainable code
- Add comments for complex logic

### Commit Messages

- Use clear and descriptive commit messages
- Follow conventional commit format when possible
- Reference issue numbers when applicable

### Pull Requests

1. Create a feature branch from \`main\`
2. Make your changes
3. Ensure all tests pass
4. Submit a pull request with a clear description

## Reporting Issues

When reporting issues, please include:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information if relevant

## Feature Requests

Feature requests are welcome! Please:
- Check if the feature already exists
- Provide a clear use case
- Explain the expected behavior

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback

Thank you for contributing to TeamTrack!`;

export const GeneralSettings: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/sign-in');
      return;
    }
    setIsAuthenticated(true);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-dark-text-muted font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-full bg-white dark:bg-dark-bg transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-dark-text-muted">Manage your account and application preferences</p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text">Appearance</h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">Customize the application theme</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text">Dark Theme</h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">
                    {theme === 'dark' ? 'Dark mode is enabled' : 'Light mode is enabled'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    theme === 'dark'
                      ? 'bg-black dark:bg-white focus:ring-black dark:focus:ring-white'
                      : 'bg-gray-200 focus:ring-gray-500'
                  }`}
                  role="switch"
                  aria-checked={theme === 'dark'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Contributing Section */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text">Contributing Guidelines</h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-muted mt-1">Information for developers contributing to TeamTrack</p>
            </div>
            <div className="p-4 sm:p-6 overflow-x-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{CONTRIBUTING_CONTENT}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Additional Settings Sections */}
          <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text">Application Settings</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 dark:border-dark-border last:border-0 gap-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text">Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Manage notification preferences</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors text-sm whitespace-nowrap">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .prose.dark h1, .dark .prose h1 {
          color: #f1f5f9;
        }
        .prose.dark h2, .dark .prose h2 {
          color: #f1f5f9;
        }
        .prose.dark h3, .dark .prose h3 {
          color: #f1f5f9;
        }
        .prose.dark p, .dark .prose p {
          color: #cbd5e1;
        }
        .prose.dark li, .dark .prose li {
          color: #cbd5e1;
        }
        .prose.dark code, .dark .prose code {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .prose.dark pre, .dark .prose pre {
          background-color: #1e293b;
        }
        .prose.dark strong, .dark .prose strong {
          color: #f1f5f9;
        }
      `}</style>
    </div>
  );
};
