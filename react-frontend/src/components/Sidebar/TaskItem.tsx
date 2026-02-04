import React, { useCallback, useEffect, useState } from 'react';
import { FileText, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskDTO, CreateTaskRequest } from '@/types/dto.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import InlineEdit from '@/components/shared/InlineEdit.js';

interface TaskItemProps {
  task: TaskDTO;
  level: number;
  onUpdateTask: (id: string, data: Partial<CreateTaskRequest>) => Promise<any>;
  isRemoving?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({ task, level, onUpdateTask, isRemoving = false }) => {
  const navigate = useNavigate();
  const { openContextMenu } = useContextMenu();
  const [isRenaming, setIsRenaming] = useState(false);
  const paddingLeft = level * 12 + 20;

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
    await onUpdateTask(task.id, { task: newTitle });
    setIsRenaming(false);
  }, [onUpdateTask, task.id]);

  const handleOpenContextMenu = useCallback((e: React.MouseEvent) => {
    openContextMenu(e, { type: 'task', taskId: task.id });
  }, [openContextMenu, task.id]);

  const handleNavigate = useCallback(() => {
    navigate(`/task/${task.id}`);
  }, [navigate, task.id]);


  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md cursor-pointer transition-all group ${isRemoving ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'}`}
      style={{ paddingLeft }}
      onClick={handleNavigate}
      onContextMenu={handleOpenContextMenu}
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
            className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
          />
        </div>
      ) : (
        <span className="text-sm text-gray-600 dark:text-dark-text-muted truncate flex-1">
          {task.task || 'Untitled'}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleOpenContextMenu(e);
        }}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-opacity flex-shrink-0"
        title="Task actions"
      >
        <MoreVertical className="w-3 h-3 text-gray-500" />
      </button>

    </div>
  );
}, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.task.task === next.task.task &&
    prev.task.folder_id === next.task.folder_id &&
    prev.task.priority === next.task.priority &&
    prev.task.progress === next.task.progress &&
    prev.level === next.level
  );
});

export default TaskItem;
