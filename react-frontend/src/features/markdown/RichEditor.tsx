import React, { useEffect, useRef, useState } from 'react';
import { BlockNoteViewRaw, useCreateBlockNote } from '@blocknote/react';
import type { PartialBlock } from '@blocknote/core';
import '@blocknote/core/style.css';
import '@blocknote/react/style.css';
import './rich-editor.css';

export interface RichEditorProps {
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

export const RichEditor: React.FC<RichEditorProps> = ({
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
    </div>
  );
};

export default React.memo(RichEditor);
