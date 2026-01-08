import React, { useState, useRef, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';
import { Token } from '@/app/api/token.js';

const getToken = () => Token.get();

interface TaskCardProps {
  task: Task;
  users: User[];
  onUpdate: () => Promise<void>;
  onClick: () => void;
  teamId: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  not_started: { label: 'Not started', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  done: { label: 'Done', color: 'text-green-700', bgColor: 'bg-green-100' },
};

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-green-700', bgColor: 'bg-green-50' },
  medium: { label: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  high: { label: 'High', color: 'text-red-700', bgColor: 'bg-red-50' },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  onUpdate,
  onClick,
  teamId,
}) => {
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setIsEditingAssignee(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsEditingStatus(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setIsEditingPriority(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTaskField = async (field: 'user_ids' | 'progress' | 'priority', value: string | string[]) => {
    setIsUpdating(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        setError('Authentication required');
        return;
      }

      if (field === 'progress') {
        const res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update_progress`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            progress: value,
            task: task.task,
            description: task.description,
            user_ids: userIds,
          }),
        });
        if (res.ok) {
          await onUpdate();
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Failed to update task' }));
          setError(errorData.error || 'Failed to update task');
        }
      } else if (field === 'priority') {
        const res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            task: task.task,
            description: task.description,
            priority: value,
            user_ids: userIds,
          }),
        });
        if (res.ok) {
          await onUpdate();
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Failed to update task' }));
          setError(errorData.error || 'Failed to update task');
        }
      } else if (field === 'user_ids') {
        const res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            task: task.task,
            description: task.description,
            priority: task.priority,
            user_ids: value as string[],
          }),
        });
        if (res.ok) {
          await onUpdate();
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Failed to update task' }));
          setError(errorData.error || 'Failed to update task');
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsUpdating(false);
      setIsEditingAssignee(false);
      setIsEditingStatus(false);
      setIsEditingPriority(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('.dropdown-menu') ||
      target.closest('.editable-field') ||
      target.closest('button') ||
      target.closest('select')
    ) {
      return;
    }
    onClick();
  };

  const toggleUserAssignment = (userId: string) => {
    const newUserIds = userIds.includes(userId)
      ? userIds.filter(id => id !== userId)
      : [...userIds, userId];
    updateTaskField('user_ids', newUserIds);
  };

  if (!task || !task.id) {
    return null;
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
    >
      <div className="flex items-center gap-4 px-4 py-3 text-sm">
        {/* Task Name */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {task.task || 'Untitled Task'}
          </div>
          {task.description && (
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {task.description}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="w-40 flex-shrink-0" ref={assigneeRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingAssignee(!isEditingAssignee);
              }}
              className="editable-field flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {assignedUsers.length > 0 ? (
                <div className="flex items-center gap-1.5 -space-x-1 flex-wrap">
                  {assignedUsers.slice(0, 4).map((user) => (
                    <div
                      key={user.id}
                      className="relative"
                      title={`${user.firstName} ${user.lastName}`}
                    >
                      <div className="w-8 h-8 rounded-full ring-2 ring-white">
                        <Avatar user={user} size="sm" />
                      </div>
                    </div>
                  ))}
                  {assignedUsers.length > 4 && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white">
                      +{assignedUsers.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">Unassigned</span>
              )}
            </div>

            {isEditingAssignee && (
              <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-2 min-w-[240px] max-h-[320px] overflow-y-auto">
                <div className="space-y-1">
                  {users.map((user) => {
                    const isSelected = userIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserAssignment(user.id);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 hover:bg-blue-100' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="relative">
                          <Avatar user={user} size="sm" />
                          {isSelected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                              <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                          {user.firstName} {user.lastName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="w-32 flex-shrink-0" ref={statusRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingStatus(!isEditingStatus);
              }}
              className="editable-field inline-block px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig[status].bgColor} ${statusConfig[status].color}`}>
                {statusConfig[status].label}
              </span>
            </div>

            {isEditingStatus && (
              <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] min-w-[140px]">
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskField('progress', key);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                  >
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="w-28 flex-shrink-0" ref={priorityRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPriority(!isEditingPriority);
              }}
              className="editable-field inline-block px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${priorityConfig[priority].bgColor} ${priorityConfig[priority].color}`}>
                {priorityConfig[priority].label}
              </span>
            </div>

            {isEditingPriority && (
              <div className="dropdown-menu absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] min-w-[120px]">
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskField('priority', key);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                  >
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isUpdating && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute top-2 right-2 bg-red-50 border border-red-200 text-red-800 px-3 py-1.5 rounded-lg text-xs z-20 shadow-md">
          {error}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            className="ml-2 text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
