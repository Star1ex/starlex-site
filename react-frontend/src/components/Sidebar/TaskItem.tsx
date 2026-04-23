import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FileText, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskDTO, CreateTaskRequest } from '@/types/dto.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import InlineEdit from '@/components/shared/InlineEdit.js';
import { useDraggable } from '@dnd-kit/core';

interface TaskItemProps {
  task: TaskDTO;
  level: number;
  onUpdateTask: (id: string, data: Partial<CreateTaskRequest>) => Promise<any>;
  isRemoving?: boolean;
  recentTaskIds?: Record<string, boolean>;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({ task, level, onUpdateTask, isRemoving = false, recentTaskIds = {} }) => {
  const navigate = useNavigate();
  const { openContextMenu } = useContextMenu();
  const [isRenaming, setIsRenaming] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savingRenameRef = useRef(false);
  const clickTimerRef = useRef<number | null>(null);
  const openDelayMs = 220;
  const paddingLeft = level * 12 + 20;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: 'task', id: task.id },
  });
  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  useEffect(() => {
    const onRename = (event: Event) => {
      const ev = event as CustomEvent;
      if (ev?.detail?.type === 'task' && ev?.detail?.id === task.id) {
        setIsRenaming(true);
      }
    };

    window.addEventListener('sidebarRename', onRename as EventListener);
    return () => window.removeEventListener('sidebarRename', onRename as EventListener);
  }, [task.id]);

  const handleRename = useCallback(async (newTitle: string) => {
    if (savingRenameRef.current) return;
    savingRenameRef.current = true;
    const previousTitle = task.task || 'Untitled';
    try {
      await onUpdateTask(task.id, { task: newTitle });
      setShowSaved(true);
      window.setTimeout(() => setShowSaved(false), 700);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('personalTaskTitleChange', { detail: { id: task.id, task: previousTitle } }));
    } finally {
      setIsRenaming(false);
      savingRenameRef.current = false;
    }
  }, [onUpdateTask, task.id, task.task]);

  const handleOpenContextMenu = useCallback((e: React.MouseEvent) => {
    openContextMenu(e, { type: 'task', taskId: task.id });
  }, [openContextMenu, task.id]);

  const handleNavigate = useCallback(() => {
    if (isRenaming) return;
    navigate(`/task/${task.id}`);
  }, [navigate, task.id, isRenaming]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isRenaming) return;
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = window.setTimeout(() => {
      handleNavigate();
      clickTimerRef.current = null;
    }, openDelayMs);
  }, [handleNavigate, isRenaming]);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        window.clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  const isRecent = !!recentTaskIds[task.id];
  const [isFresh, setIsFresh] = useState(task.id.startsWith('temp-') || isRecent);

  useEffect(() => {
    if (task.id.startsWith('temp-') || isRecent) {
      setIsFresh(true);
      const timer = window.setTimeout(() => {
        setIsFresh(false);
      }, 60);
      return () => window.clearTimeout(timer);
    }
    return;
  }, [task.id, isRecent]);

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md cursor-pointer transition-all duration-200 group will-change-transform ${
        isRemoving ? 'opacity-0 -translate-y-1 scale-95 pointer-events-none' : isFresh ? 'opacity-0 -translate-y-1 scale-95' : 'opacity-100 translate-y-0 scale-100'
      } ${isDragging ? 'opacity-60' : ''}`}
      style={{ paddingLeft, ...(dragStyle || {}) }}
      onClick={handleClick}
      onContextMenu={handleOpenContextMenu}
      {...attributes}
      {...listeners}
    >
      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />

      {isRenaming ? (
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <InlineEdit
            value={task.task || 'Untitled'}
            onSave={handleRename}
            onCancel={() => setIsRenaming(false)}
            onChange={(value) => {
              window.dispatchEvent(new CustomEvent('personalTaskTitleChange', { detail: { id: task.id, task: value } }));
            }}
            className="w-full text-sm bg-transparent border-0 outline-none p-0 focus:outline-none"
          />
        </div>
        ) : (
        <span
          className="task-title text-sm text-gray-600 dark:text-dark-text-muted truncate flex-1"
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (clickTimerRef.current) {
              window.clearTimeout(clickTimerRef.current);
              clickTimerRef.current = null;
            }
            setIsRenaming(true);
          }}
        >
          {task.task || 'Untitled'}
        </span>
      )}

      {showSaved && (
        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleOpenContextMenu(e);
        }}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-opacity duration-200 flex-shrink-0"
        title="Task actions"
      >
        <MoreVertical className="w-3 h-3 text-gray-500" />
      </button>

    </div>
  );
}, (prev, next) => {
  const prevRecent = prev.recentTaskIds?.[prev.task.id] ?? false;
  const nextRecent = next.recentTaskIds?.[next.task.id] ?? false;
  return (
    prev.task.id === next.task.id &&
    prev.task.task === next.task.task &&
    prev.task.folder_id === next.task.folder_id &&
    prev.task.priority === next.task.priority &&
    prev.task.progress === next.task.progress &&
    prev.level === next.level &&
    prev.isRemoving === next.isRemoving &&
    prevRecent === nextRecent
  );
});

export default TaskItem;
