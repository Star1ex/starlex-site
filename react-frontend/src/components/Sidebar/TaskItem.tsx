import React, { useState } from 'react';
import type { TaskDTO } from '@/types/dto.js';

interface TaskItemProps {
  task: TaskDTO;
  level: number;
  onNavigate: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, level, onNavigate }) => {
  const [showActions, setShowActions] = useState(false);
  const paddingLeft = 12 + level * 16;

  return (
    <div className="task-item group" style={{ paddingLeft: `${paddingLeft}px` }} onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <button onClick={onNavigate} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors text-left">
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-500 dark:text-dark-text-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <span className="flex-1 text-sm text-gray-700 dark:text-dark-text truncate">{task.task}</span>

        {task.priority === 'high' && showActions && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="High priority" />}
      </button>
    </div>
  );
};

export default TaskItem;
