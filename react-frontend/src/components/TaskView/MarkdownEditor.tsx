import React, { useState } from 'react';
import { Bold, CheckSquare, Code, Edit2, Eye, FileCode, Italic, Link, List, Quote, Strikethrough } from 'lucide-react';
import MarkdownPreview from './MarkdownPreview.js';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'edit' | 'preview';
  showToolbar?: boolean;
  onTogglePreview?: () => void;
  toolbarClassName?: string;
  textareaClassName?: string;
  previewClassName?: string;
  containerClassName?: string;
  onPreviewClick?: () => void;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  mode,
  showToolbar = true,
  onTogglePreview,
  toolbarClassName,
  textareaClassName,
  previewClassName,
  containerClassName,
  onPreviewClick,
  textareaRef,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const isPreview = mode ? mode === 'preview' : showPreview;

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
    <div className={containerClassName || 'flex flex-col h-full'}>
      {showToolbar && (
        <div className={toolbarClassName || 'flex items-center gap-2 py-2'}>
        <ToolbarButton onClick={() => insertMarkdown('# ')} title="Heading 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('## ')} title="Heading 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('**', '**')} title="Bold"><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('*', '*')} title="Italic"><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('~~', '~~')} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-gray-200 dark:bg-dark-border" />
        <ToolbarButton onClick={() => insertMarkdown('`', '`')} title="Inline Code"><Code className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('```\n', '\n```')} title="Code Block"><FileCode className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('[](', ')')} title="Link"><Link className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('- ')} title="List"><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('- [ ] ')} title="Checklist"><CheckSquare className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => insertMarkdown('> ')} title="Quote"><Quote className="w-4 h-4" /></ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => (onTogglePreview ? onTogglePreview() : setShowPreview(!showPreview))} title={isPreview ? 'Edit' : 'Preview'}>
          {isPreview ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </ToolbarButton>
      </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className={previewClassName || 'h-full overflow-y-auto'} onClick={onPreviewClick}>
            <MarkdownPreview value={value} />
          </div>
        ) : (
          <textarea
            ref={textareaRef as any}
            data-markdown-editor="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start typing... Use markdown for formatting"
            className={textareaClassName || 'w-full h-full text-base leading-relaxed bg-transparent border-none outline-none resize-none font-normal'}
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
