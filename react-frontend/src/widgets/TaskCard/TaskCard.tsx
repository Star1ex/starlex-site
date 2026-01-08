import React from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';

interface TaskCardProps {
  task: Task;
  users: User[];
  onUpdate: () => Promise<void>;
  onClick: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-50 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-50 text-yellow-700' },
  high: { label: 'High', color: 'bg-red-50 text-red-700' },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  onUpdate,
  onClick,
}) => {
  const userIds = task.user_ids?.map(u => typeof u === 'string' ? u : u.id) || [];
  const assignedUsers = userIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[];

  const priority = (task.priority as 'low' | 'medium' | 'high') || 'medium';

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg sm:text-xl font-bold flex-1 pr-4">{task.task}</h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`px-2 py-1 text-xs font-medium rounded-lg ${priorityConfig[priority].color}`}>
            {priorityConfig[priority].label}
          </div>
          <div className={`px-2 py-1 text-xs font-medium rounded-lg ${statusConfig[task.progress].color}`}>
            {statusConfig[task.progress].label}
          </div>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2">
        {assignedUsers.length > 0 ? (
          <>
            {assignedUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="transition-transform duration-200 hover:scale-110">
                <Avatar user={user} size="sm" />
              </div>
            ))}
            {assignedUsers.length > 3 && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                +{assignedUsers.length - 3}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400">No assignees</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
