import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { taskService } from '@/services/api/index.js';
import type { Task } from '@/entities/types.js';

type TeamTaskPanelProps = {
  task: Task | null;
  isOpen: boolean;
  teamId: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onTitleChange?: (id: string, title: string) => void;
};

export const TeamTaskPanel: React.FC<TeamTaskPanelProps> = ({ task, isOpen, teamId, onClose, onUpdated, onTitleChange }) => {
  const minWidth = 420;
  const getMaxWidth = () => Math.max(minWidth, Math.floor(window.innerWidth * 0.5));
  const [panelWidth, setPanelWidth] = useState(() => {
    if (typeof window === 'undefined') return minWidth;
    return getMaxWidth();
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(minWidth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const currentTaskIdRef = useRef<string | null>(null);
  const isEditingTitleRef = useRef(false);
  const isEditingDescRef = useRef(false);

  useEffect(() => {
    if (!task) return;
    const nextId = task.id;
    const isNewTask = currentTaskIdRef.current !== nextId;
    if (isNewTask) {
      currentTaskIdRef.current = nextId;
      setTitle(task.task || '');
      setDescription(task.description || '');
      setIsInitialLoad(true);
      isEditingTitleRef.current = false;
      isEditingDescRef.current = false;
    }
  }, [task]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!task) return;
    onTitleChange?.(task.id, title);
  }, [title, task, onTitleChange]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: 'Describe the task…',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ],
    content: description || '',
    onUpdate: ({ editor: tiptap }) => {
      isEditingDescRef.current = true;
      setDescription(tiptap.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'team-task-editor',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((description || '') !== current && !isEditingDescRef.current) {
      editor.commands.setContent(description || '', false);
    }
  }, [description, editor]);

  useEffect(() => {
    const updateBounds = () => {
      const maxWidth = getMaxWidth();
      setPanelWidth((prev) => Math.min(maxWidth, Math.max(minWidth, prev)));
    };
    updateBounds();
    const onResize = () => updateBounds();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [minWidth]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const maxWidth = getMaxWidth();
      const delta = dragStartX.current - e.clientX;
      const nextWidth = Math.max(minWidth, Math.min(maxWidth, dragStartWidth.current + delta));
      setPanelWidth(nextWidth);
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
  };

  const debouncedTitle = useDebounce(title, 400);
  const debouncedDescription = useDebounce(description, 400);
  const lastSentRef = useRef<{ title: string; description: string }>({ title: '', description: '' });

  useEffect(() => {
    if (!task) return;
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const controller = new AbortController();
    const save = async () => {
      try {
        if (
          lastSentRef.current.title === debouncedTitle &&
          lastSentRef.current.description === debouncedDescription
        ) {
          return;
        }
        const updates: Promise<void>[] = [];
        if (lastSentRef.current.title !== debouncedTitle) {
          updates.push(taskService.updateTeamTaskTitle(teamId, task.id, debouncedTitle));
        }
        if (lastSentRef.current.description !== debouncedDescription) {
          updates.push(taskService.updateTeamTaskDescription(teamId, task.id, debouncedDescription));
        }
        if (updates.length > 0) {
          await Promise.all(updates);
          lastSentRef.current = { title: debouncedTitle, description: debouncedDescription };
          onUpdated({ ...task, task: debouncedTitle, description: debouncedDescription });
        }
      } catch (err) {
        console.error('Failed to update team task:', err);
      }
    };
    save();
    return () => controller.abort();
  }, [debouncedTitle, debouncedDescription, task, teamId, onUpdated, isInitialLoad]);

  if (!isOpen || !task) return null;

  return (
    <aside
      className="fixed top-0 bottom-0 right-0 z-30"
      style={{ width: panelWidth }}
      aria-label="Task details"
    >
      <div className="h-full bg-white dark:bg-dark-surface rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] border border-gray-100 dark:border-dark-border flex flex-col">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="w-full flex items-center justify-center">
            <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-dark-border" />
          </div>
          <button
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-2 pb-4 overflow-y-auto">
          <input
            value={title}
            onChange={(e) => {
              isEditingTitleRef.current = true;
              setTitle(e.target.value);
            }}
            placeholder="Title"
            className="w-full text-2xl font-semibold text-gray-900 dark:text-dark-text bg-transparent border-0 outline-none mb-4"
          />

          <div className="mt-2">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize"
        onPointerDown={handleDragStart}
        aria-hidden="true"
      />

      <style>{`
        .team-task-editor {
          min-height: 360px;
          padding: 0;
          outline: none;
          border: none;
          color: inherit;
          font-size: 1rem;
          line-height: 1.7;
          background: transparent;
        }
        .team-task-editor p { margin: 0 0 0.9em 0; }
        .team-task-editor h1 { font-size: 2.05rem; font-weight: 700; margin: 0.6em 0 0.4em 0; line-height: 1.15; }
        .team-task-editor h2 { font-size: 1.6rem; font-weight: 700; margin: 0.7em 0 0.4em 0; line-height: 1.2; }
        .team-task-editor h3 { font-size: 1.3rem; font-weight: 700; margin: 0.7em 0 0.35em 0; line-height: 1.25; }
        .team-task-editor ul, .team-task-editor ol { padding-left: 1.5em; margin: 0 0 0.9em 0; }
        .team-task-editor li { margin: 0.2em 0; }
        .team-task-editor code { background-color: #f3f4f6; padding: 0.2em 0.35em; border-radius: 0.25rem; font-size: 0.95em; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .team-task-editor pre { background-color: #f3f4f6; padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin: 0 0 1em 0; }
        .team-task-editor blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; margin: 0 0 1em 0; color: #6b7280; }
        .team-task-editor a { color: #2563eb; text-decoration: underline; }
        .team-task-editor .is-empty::before { content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0; }
        .dark .team-task-editor code { background-color: #1e293b; color: #f1f5f9; }
        .dark .team-task-editor pre { background-color: #1e293b; color: #f1f5f9; }
        .dark .team-task-editor blockquote { border-left-color: #475569; color: #cbd5e1; }
        .dark .team-task-editor a { color: #60a5fa; }
      `}</style>
    </aside>
  );
};

export default TeamTaskPanel;
