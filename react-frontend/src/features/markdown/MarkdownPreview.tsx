import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface MarkdownPreviewProps {
  value: string;
  emptyText?: string;
}

const markdownComponents: Components = {
  input: ({ checked, type, ...props }) => {
    if (type === 'checkbox') {
      return <input type="checkbox" checked={Boolean(checked)} disabled className="mr-2" />;
    }
    return <input type={type} checked={checked} {...props} />;
  },
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    if (match) {
      return (
        <div className="relative">
          <div className="absolute top-2 right-2 text-xs text-gray-200 bg-gray-800 px-2 py-1 rounded">
            {match[1]}
          </div>
          <code className={className} {...props}>
            {children}
          </code>
        </div>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ value, emptyText = '' }) => {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSanitize, rehypeKatex, rehypeHighlight]}
        components={markdownComponents}
      >
        {value || emptyText}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
