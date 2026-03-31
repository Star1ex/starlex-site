import React, { useEffect, useRef, useState } from 'react';
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/core/style.css';
import '@blocknote/react/style.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  containerClassName?: string;
}

const EMPTY_DOC: PartialBlock[] = [{ type: 'paragraph' }];

function normalizeMarkdownForCodeBlocks(markdown: string): string {
  if (!markdown) return markdown;

  // Convert a paragraph that contains only inline-code syntax (`code`)
  // into a fenced code block.
  const inlineCodeParagraphsToFences = markdown.replace(
    /(^|\n)\s*`([^`\n]+)`\s*(?=\n|$)/g,
    (_match, lineStart, code) => `${lineStart}\`\`\`\n${code}\n\`\`\``
  );

  return inlineCodeParagraphsToFences;
}

function isDarkTheme(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  containerClassName,
}) => {
  const editor = useCreateBlockNote();
  const lastSyncedMarkdownRef = useRef('');
  const isApplyingProgrammaticChangeRef = useRef(false);
  const emitFrameRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (isDarkTheme() ? 'dark' : 'light'));

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setTheme(isDarkTheme() ? 'dark' : 'light');
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (emitFrameRef.current !== null) {
        cancelAnimationFrame(emitFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextMarkdown = value ?? '';
    if (nextMarkdown === lastSyncedMarkdownRef.current) return;

    let nextBlocks: PartialBlock[] = EMPTY_DOC;
    if (nextMarkdown.trim().length > 0) {
      try {
        nextBlocks = editor.tryParseMarkdownToBlocks(nextMarkdown);
      } catch (error) {
        console.error('Failed to parse markdown into blocks:', error);
      }
    }

    isApplyingProgrammaticChangeRef.current = true;
    editor.replaceBlocks(editor.document, nextBlocks);
    isApplyingProgrammaticChangeRef.current = false;
    lastSyncedMarkdownRef.current = nextMarkdown;
  }, [editor, value]);

  return (
    <div className={`${containerClassName || ''} notion-md-editor`}>
      <BlockNoteViewRaw
        editor={editor}
        theme={theme}
        formattingToolbar
        linkToolbar={false}
        slashMenu={false}
        emojiPicker={false}
        sideMenu={false}
        filePanel={false}
        tableHandles={false}
        comments={false}
        onChange={() => {
          if (isApplyingProgrammaticChangeRef.current) return;

          const rawMarkdown = editor.blocksToMarkdownLossy(editor.document);
          const normalizedMarkdown = normalizeMarkdownForCodeBlocks(rawMarkdown);
          if (normalizedMarkdown === lastSyncedMarkdownRef.current) return;

          if (normalizedMarkdown !== rawMarkdown) {
            let normalizedBlocks: PartialBlock[] = EMPTY_DOC;
            if (normalizedMarkdown.trim().length > 0) {
              try {
                normalizedBlocks = editor.tryParseMarkdownToBlocks(normalizedMarkdown);
              } catch (error) {
                console.error('Failed to parse normalized markdown into blocks:', error);
              }
            }

            isApplyingProgrammaticChangeRef.current = true;
            editor.replaceBlocks(editor.document, normalizedBlocks);
            isApplyingProgrammaticChangeRef.current = false;
          }

          lastSyncedMarkdownRef.current = normalizedMarkdown;
          if (emitFrameRef.current !== null) {
            cancelAnimationFrame(emitFrameRef.current);
          }
          emitFrameRef.current = requestAnimationFrame(() => {
            onChange(normalizedMarkdown);
          });
        }}
      />
      <style>{`
        /* ── Editor container ── */
        .notion-md-editor .bn-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          font-size: 15px;
          line-height: 1.75;
        }

        /* Remove BlockNote's own border/shadow so it integrates seamlessly */
        .notion-md-editor .bn-editor {
          border: none !important;
          box-shadow: none !important;
          padding: 0;
        }

        /* Generous block padding */
        .notion-md-editor .bn-block-group > .bn-block-outer > .bn-block {
          padding-top: 2px;
          padding-bottom: 2px;
        }

        /* ── Formatting toolbar ── */
        .notion-md-editor .bn-formatting-toolbar {
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        /* ── Code blocks ── */
        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 12px;
          background: #0f172a;
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.12);
          overflow: hidden;
        }

        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > pre {
          margin: 0;
          padding: 14px 16px;
          font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
          font-size: 0.9rem;
          line-height: 1.65;
          color: #e2e8f0;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.45) transparent;
        }

        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.8));
          border-bottom: 1px solid rgba(148, 163, 184, 0.25);
          padding: 6px 10px;
        }

        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          color: #cbd5e1;
          background: transparent;
          font-size: 12px;
          letter-spacing: 0.02em;
        }

        .dark .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          border-color: rgba(148, 163, 184, 0.24);
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.35);
        }

      `}</style>
    </div>
  );
};

export default React.memo(MarkdownEditor);
