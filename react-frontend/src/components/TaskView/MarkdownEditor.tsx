import React, { useState } from 'react';
import { Bold, CheckSquare, Code, Edit2, Eye, FileCode, Italic, Link, List, Quote, Strikethrough } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview.js';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [showPreview, setShowPreview] = useState(false);

  const insertMarkdown = (before: string, after = '') => {
    const textarea = document.querySelector('textarea[data-markdown-editor="true"]') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
        <ToolbarButton onClick={() => insertMarkdown('# ')} title="Heading 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('## ')} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('**', '**')} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('*', '*')} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('~~', '~~')} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-300 dark:bg-dark-border" />
        <ToolbarButton onClick={() => insertMarkdown('`', '`')} title="Inline Code"><Code className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('```\n', '\n```')} title="Code Block"><FileCode className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('[](', ')')} title="Link"><Link className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('- ')} title="List"><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('- [ ] ')} title="Checklist"><CheckSquare className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('> ')} title="Quote"><Quote className="w-4 h-4" /></ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => setShowPreview(!showPreview)} title={showPreview ? 'Edit' : 'Preview'}>
          {showPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </ToolbarButton>
      </div>

      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-y-auto p-6">
            <MarkdownPreview value={value} />
          </div>
        ) : (
          <textarea
            data-markdown-editor="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start typing... Use markdown for formatting"
            className="w-full h-full p-6 text-base leading-relaxed bg-transparent border-none outline-none resize-none font-mono"
            spellCheck
          />
        )}
      </div>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-colors"
    type="button"
  >
    {children}
  </button>
);

export default MarkdownEditor;
