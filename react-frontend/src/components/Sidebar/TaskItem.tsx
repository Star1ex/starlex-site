import React, { useEffect, useState } from 'react';
import { FileText, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskDTO, CreateTaskRequest } from '@/types/dto.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import InlineEdit from '@/components/shared/InlineEdit.js';

interface TaskItemProps {
  task: TaskDTO;
  level: number;
  onUpdateTask: (id: string, data: Partial<CreateTaskRequest>) => Promise<any>;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, level, onUpdateTask }) => {
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

  const handleRename = async (newTitle: string) => {
    await onUpdateTask(task.id, { task: newTitle });
    setIsRenaming(false);
  };


  return (
    <div
      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md cursor-pointer transition-colors group"
      style={{ paddingLeft }}
      onClick={() => navigate(`/task/${task.id}`)}
      onContextMenu={(e) => openContextMenu(e, { type: 'task', taskId: task.id })}
    >
      <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />

      {isRenaming ? (
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <InlineEdit
            value={task.task || 'Untitled'}
            onSave={handleRename}
            onCancel={() => setIsRenaming(false)}
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
          openContextMenu(e, { type: 'task', taskId: task.id });
        }}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-opacity flex-shrink-0"
        title="Task actions"
      >
        <MoreVertical className="w-3 h-3 text-gray-500" />
      </button>

    </div>
  );
};

export default TaskItem;
