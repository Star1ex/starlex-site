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
        formattingToolbar={false}
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
        /* ── Kill BlockNote's own background — editor must be invisible ── */
        .notion-md-editor .bn-container,
        .notion-md-editor .bn-editor,
        .notion-md-editor [class^="bn-"],
        .notion-md-editor [class*=" bn-"] {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* ── Restore font/spacing on the container ── */
        .notion-md-editor .bn-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          font-size: 15px;
          line-height: 1.75;
        }

        /* ── Task detail editor typography: keep headings useful, not hero-sized ── */
        .notion-md-editor h1,
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-level="1"],
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-heading-level="1"],
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-prop-level="1"] {
          font-size: 1.45rem !important;
          line-height: 1.22 !important;
          font-weight: 650 !important;
          letter-spacing: 0 !important;
          margin: 1.15rem 0 0.45rem !important;
        }

        .notion-md-editor h2,
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-level="2"],
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-heading-level="2"],
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-prop-level="2"] {
          font-size: 1.2rem !important;
          line-height: 1.3 !important;
          font-weight: 640 !important;
          letter-spacing: 0 !important;
          margin: 1rem 0 0.4rem !important;
        }

        .notion-md-editor h3,
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-level="3"],
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-heading-level="3"],
        .notion-md-editor .bn-block-content[data-content-type="heading"][data-prop-level="3"] {
          font-size: 1.05rem !important;
          line-height: 1.35 !important;
          font-weight: 620 !important;
          letter-spacing: 0 !important;
          margin: 0.85rem 0 0.35rem !important;
        }

        .notion-md-editor .bn-block-content[data-content-type="heading"] {
          color: rgba(255,255,255,0.88) !important;
        }

        /* ── Checklists: minimal dark controls instead of bright browser squares ── */
        .notion-md-editor input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 13px;
          height: 13px;
          margin: 0 8px 0 0;
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(0,0,0,0.35);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
          display: inline-grid;
          place-content: center;
          flex-shrink: 0;
          vertical-align: -2px;
        }

        .notion-md-editor input[type="checkbox"]:checked {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.32);
        }

        .notion-md-editor input[type="checkbox"]:checked::after {
          content: "";
          width: 7px;
          height: 4px;
          border-left: 1.5px solid rgba(255,255,255,0.78);
          border-bottom: 1.5px solid rgba(255,255,255,0.78);
          transform: translateY(-1px) rotate(-45deg);
        }

        .notion-md-editor .bn-block-content[data-content-type="checkListItem"],
        .notion-md-editor .bn-block-content[data-content-type="checkList"],
        .notion-md-editor .bn-block-content[data-content-type="todoListItem"] {
          color: rgba(255,255,255,0.72) !important;
        }

        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor input[type="checkbox"] {
          border-color: rgba(15,23,42,0.22);
          background: rgba(15,23,42,0.03);
        }

        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor input[type="checkbox"]:checked {
          background: rgba(15,23,42,0.10);
          border-color: rgba(15,23,42,0.34);
        }

        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor input[type="checkbox"]:checked::after {
          border-color: rgba(15,23,42,0.78);
        }

        html.theme-ultra-dark .notion-md-editor input[type="checkbox"] {
          border-color: rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.55);
        }

        html.theme-ultra-dark .notion-md-editor input[type="checkbox"]:checked {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.30);
        }

        /* ── Code blocks: shared structure (restore border/bg only here) ── */
        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > pre {
          margin: 0;
          padding: 14px 16px;
          font-family: 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace !important;
          font-size: 0.875rem;
          line-height: 1.65;
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div {
          border-bottom-width: 1px !important;
          border-bottom-style: solid !important;
          padding: 5px 10px;
        }

        .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          background: transparent !important;
          font-size: 11px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          border: none !important;
          outline: none;
          cursor: pointer;
          opacity: 0.65;
        }

        /* ── Light theme: slightly darker than white page ── */
        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          background: #f0f2f5 !important;
          border: 1px solid rgba(0,0,0,0.07) !important;
        }
        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > pre {
          color: #1e293b;
          scrollbar-color: rgba(0,0,0,0.15) transparent;
        }
        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div {
          background: #e5e8ed !important;
          border-bottom-color: rgba(0,0,0,0.07) !important;
        }
        html:not(.dark):not(.theme-ultra-dark):not(.theme-solarized)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          color: #475569;
        }

        /* ── Dark theme: slightly lighter than #0a1929 (--bg-primary) ── */
        html.dark:not(.theme-ultra-dark)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          background: #112236 !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
        }
        html.dark:not(.theme-ultra-dark)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > pre {
          color: #b6c4d6;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        html.dark:not(.theme-ultra-dark)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div {
          background: #0d1b2d !important;
          border-bottom-color: rgba(255,255,255,0.06) !important;
        }
        html.dark:not(.theme-ultra-dark)
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          color: #6a86a0;
        }

        /* ── Ultra-dark theme: slightly lighter than #0b090a (--bg-primary) ── */
        html.theme-ultra-dark
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          background: #1a1617 !important;
          border: 1px solid rgba(255,255,255,0.05) !important;
        }
        html.theme-ultra-dark
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > pre {
          color: #b8b0ab;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        html.theme-ultra-dark
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div {
          background: #141011 !important;
          border-bottom-color: rgba(255,255,255,0.05) !important;
        }
        html.theme-ultra-dark
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          color: #6b625d;
        }

        /* ── Solarized: code stays dark (classic solarized-dark for code) ── */
        html.theme-solarized
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] {
          background: #073642 !important;
          border: 1px solid rgba(7,54,66,0.4) !important;
        }
        html.theme-solarized
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > pre {
          color: #93a1a1;
          scrollbar-color: rgba(147,161,161,0.25) transparent;
        }
        html.theme-solarized
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div {
          background: #002b36 !important;
          border-bottom-color: rgba(147,161,161,0.12) !important;
        }
        html.theme-solarized
          .notion-md-editor .bn-block-content[data-content-type="codeBlock"] > div > select {
          color: #4e6672;
        }

      `}</style>
    </div>
  );
};

export default React.memo(MarkdownEditor);
