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
          <div className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-1">Appearance</h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-muted">Customize the application theme</p>
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
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
          <div className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-1">Contributing Guidelines</h2>
              <p className="text-sm text-gray-600 dark:text-dark-text-muted">Information for developers contributing to TeamTrack</p>
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-x-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-6 prose-headings:mb-3 prose-p:my-3 prose-ul:my-3 prose-ol:my-3">
                <ReactMarkdown>{CONTRIBUTING_CONTENT}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Additional Settings Sections */}
          <div className="bg-white dark:bg-dark-surface rounded-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-dark-text mb-1">Application Settings</h2>
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-dark-text">Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted">Manage notification preferences</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-dark-surface transition-colors text-sm whitespace-nowrap">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .prose h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 0.75rem;
          line-height: 1.2;
        }
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .prose p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .prose ul, .prose ol {
          margin-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose li {
          margin-bottom: 0.375rem;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .prose pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }
        .prose pre code {
          background-color: transparent;
          padding: 0;
        }
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          color: #6b7280;
        }
        .prose strong {
          font-weight: 600;
        }
        .dark .prose h1, .prose.dark h1 {
          color: #f1f5f9;
        }
        .dark .prose h2, .prose.dark h2 {
          color: #f1f5f9;
        }
        .dark .prose h3, .prose.dark h3 {
          color: #f1f5f9;
        }
        .dark .prose p, .prose.dark p {
          color: #cbd5e1;
        }
        .dark .prose li, .prose.dark li {
          color: #cbd5e1;
        }
        .dark .prose code, .prose.dark code {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .dark .prose pre, .prose.dark pre {
          background-color: #1e293b;
        }
        .dark .prose blockquote, .prose.dark blockquote {
          border-left-color: #475569;
          color: #cbd5e1;
        }
        .dark .prose strong, .prose.dark strong {
          color: #f1f5f9;
        }
        .dark .prose a, .prose.dark a {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};
