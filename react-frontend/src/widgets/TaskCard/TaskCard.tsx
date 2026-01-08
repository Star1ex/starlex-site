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
  // Handle user_ids - can be array of TaskUser objects or strings
  const userIds = React.useMemo(() => {
    if (!task.user_ids || !Array.isArray(task.user_ids)) return [];
    return task.user_ids.map(u => typeof u === 'string' ? u : (u?.id || '')).filter(Boolean);
  }, [task.user_ids]);

  const assignedUsers = React.useMemo(() => {
    return userIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as User[];
  }, [userIds, users]);

  const priority = React.useMemo(() => {
    const p = task.priority as 'low' | 'medium' | 'high';
    return (p && priorityConfig[p]) ? p : 'medium';
  }, [task.priority]);

  const status = React.useMemo(() => {
    const s = task.progress as 'not_started' | 'in_progress' | 'done';
    return (s && statusConfig[s]) ? s : 'not_started';
  }, [task.progress]);

  if (!task || !task.id) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl p-5 sm:p-6 cursor-pointer hover:shadow-xl hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300 ease-out"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold flex-1 pr-4 text-gray-900 group-hover:text-black transition-colors">
          {task.task || 'Untitled Task'}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`px-2.5 py-1 text-xs font-semibold rounded-md ${priorityConfig[priority].color} shadow-sm`}>
            {priorityConfig[priority].label}
          </div>
          <div className={`px-2.5 py-1 text-xs font-semibold rounded-md ${statusConfig[status].color} shadow-sm`}>
            {statusConfig[status].label}
          </div>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500 font-medium mr-1">Assigned:</span>
        {assignedUsers.length > 0 ? (
          <div className="flex items-center gap-2">
            {assignedUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="transition-transform duration-200 hover:scale-110" title={`${user.firstName} ${user.lastName}`}>
                <Avatar user={user} size="sm" />
              </div>
            ))}
            {assignedUsers.length > 3 && (
              <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 border border-gray-200 shadow-sm">
                +{assignedUsers.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">No assignees</span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
