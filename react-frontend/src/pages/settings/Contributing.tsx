import React from 'react';
import ReactMarkdown from 'react-markdown';

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

export const Contributing: React.FC = () => {
  return (
    <div className="space-y-8 text-center max-w-3xl mx-auto">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
          Contributing to TeamTrack
        </h3>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          Guidelines for developers contributing to the TeamTrack project
        </p>
      </div>

      {/* Markdown Content */}
      <div className="text-left">
        <div className="max-w-none prose prose-base dark:prose-invert px-0 sm:px-0 py-2 overflow-x-auto prose-headings:text-gray-900 dark:prose-headings:text-dark-text prose-p:text-gray-700 dark:prose-p:text-dark-text-muted prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-dark-text prose-code:bg-gray-100 dark:prose-code:bg-dark-bg prose-code:text-gray-800 dark:prose-code:text-dark-text prose-code:rounded prose-code:px-2 prose-code:py-1 prose-pre:bg-gray-100 dark:prose-pre:bg-dark-bg prose-blockquote:border-gray-300 dark:prose-blockquote:border-dark-border prose-blockquote:text-gray-700 dark:prose-blockquote:text-dark-text-muted">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => (
                <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900 dark:text-dark-text" {...props} />
              ),
              h2: ({ ...props }) => (
                <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-dark-text" {...props} />
              ),
              h3: ({ ...props }) => (
                <h3 className="text-xl font-semibold mt-5 mb-3 text-gray-900 dark:text-dark-text" {...props} />
              ),
              p: ({ ...props }) => (
                <p className="text-[15.5px] leading-relaxed text-gray-700 dark:text-dark-text-muted mb-3" {...props} />
              ),
              ul: ({ ...props }) => (
                <ul className="list-disc list-inside space-y-2 my-3 text-gray-700 dark:text-dark-text-muted" {...props} />
              ),
              ol: ({ ...props }) => (
                <ol className="list-decimal list-inside space-y-2 my-3 text-gray-700 dark:text-dark-text-muted" {...props} />
              ),
              li: ({ ...props }) => <li className="ml-2" {...props} />,
              code: ({ inline, ...props }: any) =>
                inline ? (
                  <code className="bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text rounded px-2 py-0.5 font-mono text-sm" {...props} />
                ) : (
                  <code className="bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text rounded px-3 py-2 font-mono text-sm block overflow-x-auto" {...props} />
                ),
              pre: ({ ...props }) => (
                <pre className="bg-gray-100 dark:bg-dark-bg rounded-lg overflow-x-auto my-4 p-4" {...props} />
              ),
              blockquote: ({ ...props }) => (
                <blockquote className="border-l-4 border-gray-300 dark:border-dark-border pl-4 py-2 my-3 italic text-gray-700 dark:text-dark-text-muted" {...props} />
              ),
              a: ({ ...props }) => (
                <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
              ),
            }}
          >
            {CONTRIBUTING_CONTENT}
          </ReactMarkdown>
        </div>
      </div>

      {/* Info Box */}
      <div className="text-left">
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          <strong>Tip:</strong> Visit our GitHub repository to see the latest contribution guidelines and submit pull requests!
        </p>
      </div>
    </div>
  );
};
