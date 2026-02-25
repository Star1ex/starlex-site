import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function textToHtml(text: string): string {
  if (!text || text.trim() === '') return '';
  return text
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function htmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p><p>/gi, '\n\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Add a description...',
  className,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: {},
        italic: {},
        strike: {},
        code: {},
        codeBlock: {},
        blockquote: {},
        bulletList: {},
        orderedList: {},
        listItem: {},
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
        hardBreak: {},
        history: {},
      }),
      Typography,
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ] as any,
    content: textToHtml(value),
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: tiptapEditor }: any) => {
      const html = tiptapEditor.getHTML();
      const text = htmlToText(html);
      onChange(text);
    },
  } as any);

  useEffect(() => {
    if (!editor) return;
    const currentText = htmlToText(editor.getHTML());
    if (currentText !== value) {
      editor.commands.setContent(textToHtml(value), { emitUpdate: false } as any);
    }
  }, [value, editor]);

  return (
    <>
      <div className={className} style={{ width: '100%' }}>
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .tiptap-editor-content {
          outline: none;
          width: 100%;
          min-height: 360px;
          font-family: inherit;
          font-size: inherit;
          line-height: inherit;
          color: inherit;
          cursor: text;
        }

        .tiptap-editor-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }

        .tiptap-editor-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.25;
          margin: 1rem 0 0.5rem;
          color: inherit;
        }
        .tiptap-editor-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 0.875rem 0 0.4rem;
          color: inherit;
        }
        .tiptap-editor-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin: 0.75rem 0 0.35rem;
          color: inherit;
        }
        .tiptap-editor-content p {
          margin: 0 0 0.25rem;
          min-height: 1.5em;
        }
        .tiptap-editor-content strong {
          font-weight: 700;
          color: inherit;
        }
        .tiptap-editor-content em {
          font-style: italic;
        }
        .tiptap-editor-content s {
          text-decoration: line-through;
          opacity: 0.6;
        }

        .tiptap-editor-content code {
          font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
          font-size: 0.875em;
          background: rgba(135, 131, 120, 0.15);
          color: #eb5757;
          padding: 0.1em 0.35em;
          border-radius: 4px;
        }

        .tiptap-editor-content pre {
          background: #1e1e1e;
          color: #d4d4d4;
          border-radius: 8px;
          padding: 1rem 1.25rem;
          margin: 0.75rem 0;
          overflow-x: auto;
          font-family: 'JetBrains Mono', 'Fira Code', 'Menlo', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .tiptap-editor-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          font-size: inherit;
        }

        .tiptap-editor-content blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0.5rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .dark .tiptap-editor-content blockquote {
          border-left-color: #374151;
          color: #9ca3af;
        }

        .tiptap-editor-content ul,
        .tiptap-editor-content ol {
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }
        .tiptap-editor-content ul {
          list-style-type: disc;
        }
        .tiptap-editor-content ol {
          list-style-type: decimal;
        }
        .tiptap-editor-content li {
          margin: 0.1rem 0;
          line-height: 1.7;
        }
        .tiptap-editor-content li p {
          margin: 0;
        }

        .tiptap-editor-content hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1rem 0;
        }
        .dark .tiptap-editor-content hr {
          border-top-color: #374151;
        }

        .tiptap-editor-content ::selection {
          background: rgba(59, 130, 246, 0.2);
        }
        .dark .tiptap-editor-content ::selection {
          background: rgba(96, 165, 250, 0.25);
        }

        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror-focused {
          outline: none;
        }
      `}</style>
    </>
  );
};

export default MarkdownEditor;
