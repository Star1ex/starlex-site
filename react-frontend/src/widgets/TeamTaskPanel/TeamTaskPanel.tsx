import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { taskService } from '@/services/api/index.js';
import type { Task } from '@/entities/types.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

const MarkdownEditor = React.lazy(() =>
  import('@/components/TaskView/MarkdownEditor.js').then((m) => ({ default: m.MarkdownEditor }))
);

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
    return window.innerWidth < 768 ? window.innerWidth : getMaxWidth();
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(minWidth);

  const [title, setTitle] = useState(task?.task || '');
  const [description, setDescription] = useState(task?.description || '');
  const isInitialLoadRef = useRef(true);
  const currentTaskIdRef = useRef<string | null>(task?.id ?? null);
  const isEditingTitleRef = useRef(false);

  useEffect(() => {
    currentTaskIdRef.current = task?.id ?? null;
    isInitialLoadRef.current = true;
    isEditingTitleRef.current = false;
    lastSentRef.current = {
      title: task?.task || '',
      description: task?.description || '',
    };
  }, [task?.id, task?.task, task?.description]);

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
    if (!isEditingTitleRef.current) return;
    if (title === (task.task || '')) return;
    onTitleChange?.(task.id, title);
  }, [title, task, onTitleChange]);

  useEffect(() => {
    const updateBounds = () => {
      if (window.innerWidth < 768) {
        setPanelWidth(window.innerWidth);
        return;
      }
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
      if (window.innerWidth < 768) return;
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
    if (task.id !== currentTaskIdRef.current) return;
    if (isInitialLoadRef.current) {
      if (debouncedTitle === title && debouncedDescription === description) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    // Prevent cross-task writes: after task switch, debounced values can still
    // hold the previous task's content for ~400ms.
    if (debouncedTitle !== title || debouncedDescription !== description) {
      return;
    }

    if (
      lastSentRef.current.title === debouncedTitle &&
      lastSentRef.current.description === debouncedDescription
    ) {
      return;
    }

    const activeTaskId = task.id;
    const save = async () => {
      try {
        if (activeTaskId !== currentTaskIdRef.current) return;
        const updates: Promise<void>[] = [];
        if (lastSentRef.current.title !== debouncedTitle) {
          updates.push(taskService.updateTeamTaskTitle(teamId, activeTaskId, debouncedTitle));
        }
        if (lastSentRef.current.description !== debouncedDescription) {
          updates.push(taskService.updateTeamTaskDescription(teamId, activeTaskId, debouncedDescription));
        }
        if (updates.length > 0) {
          await Promise.all(updates);
          if (activeTaskId !== currentTaskIdRef.current) return;
          lastSentRef.current = { title: debouncedTitle, description: debouncedDescription };
          onUpdated({ ...task, id: activeTaskId, task: debouncedTitle, description: debouncedDescription });
        }
      } catch (err) {
        console.error('Failed to update team task:', err);
      }
    };
    save();
  }, [debouncedTitle, debouncedDescription, title, description, task, teamId, onUpdated]);

  if (!isOpen || !task) return null;

  return (
    <aside
      className="fixed top-0 bottom-0 right-0 z-30"
      style={{ width: panelWidth }}
      aria-label="Task details"
    >
      <div className="h-full md:rounded-2xl rounded-none shadow-2xl flex flex-col" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <BreadcrumbBack label="Tasks" onClick={onClose} className="text-xs sm:text-sm" />
          <div className="flex-1 flex items-center justify-center">
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
            <Suspense
              fallback={
                <div className="min-h-[220px] rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/40 dark:bg-dark-bg/40 animate-pulse" />
              }
            >
              <MarkdownEditor
                key={task.id}
                value={description ?? ''}
                onChange={setDescription}
                containerClassName="team-task-editor"
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hidden md:block"
        onPointerDown={handleDragStart}
        aria-hidden="true"
      />

      <style>{`
        .team-task-editor {
          color: inherit;
          font-size: 1rem;
          line-height: 1.7;
        }
      `}</style>
    </aside>
  );
};

export default TeamTaskPanel;
