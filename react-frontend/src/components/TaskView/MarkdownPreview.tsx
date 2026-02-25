import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import 'katex/dist/katex.min.css';

interface MarkdownPreviewProps {
  value: string;
  emptyText?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ value, emptyText = '' }) => {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeHighlight]}
        components={{
          input: ({ node, ...props }: any) => {
            if (props.type === 'checkbox') {
              return <input type="checkbox" checked={props.checked} disabled className="mr-2" />;
            }
            return <input {...props} />;
          },
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
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
        }}
      >
        {value || emptyText}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;
