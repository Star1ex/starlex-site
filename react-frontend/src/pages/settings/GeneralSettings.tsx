import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { Token } from '@/app/api/token.js';

const getToken = () => Token.get();

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/sign-in');
      return;
    }
    setIsAuthenticated(true);
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-full bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        <div className="space-y-8">
          {/* Contributing Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Contributing Guidelines</h2>
              <p className="text-sm text-gray-600 mt-1">Information for developers contributing to TeamTrack</p>
            </div>
            <div className="p-6">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{CONTRIBUTING_CONTENT}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Additional Settings Sections */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">Application Settings</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">Manage notification preferences</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  Configure
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <h3 className="font-medium text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-600">Customize appearance</p>
                </div>
                <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors text-sm">
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
          margin-bottom: 1rem;
          color: #111827;
        }
        .prose h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #111827;
        }
        .prose h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #111827;
        }
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: #374151;
        }
        .prose ul, .prose ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .prose li {
          margin-bottom: 0.5rem;
          color: #374151;
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
          margin-bottom: 1rem;
        }
        .prose pre code {
          background-color: transparent;
          padding: 0;
        }
        .prose strong {
          font-weight: 600;
          color: #111827;
        }
      `}</style>
    </div>
  );
};
