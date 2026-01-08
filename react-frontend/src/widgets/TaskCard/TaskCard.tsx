import React, { useState, useRef, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';
import { getAuthToken } from '@/shared/lib/authManager.js';

interface TaskCardProps {
  task: Task;
  users: User[];
  onUpdate: (updatedTask: Task) => void;
  onClick: () => void;
  onDelete: () => void;
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
  onDelete,
  teamId,
}) => {
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigneeDropdownUp, setAssigneeDropdownUp] = useState(false);
  const [statusDropdownUp, setStatusDropdownUp] = useState(false);
  const [priorityDropdownUp, setPriorityDropdownUp] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

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

  // Calculate dropdown positions when opened
  useEffect(() => {
    if (isEditingAssignee && assigneeRef.current) {
      const rect = assigneeRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 320;
      setAssigneeDropdownUp(rect.bottom + dropdownHeight > viewportHeight);
    }
  }, [isEditingAssignee]);

  useEffect(() => {
    if (isEditingStatus && statusRef.current) {
      const rect = statusRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 150;
      setStatusDropdownUp(rect.bottom + dropdownHeight > viewportHeight);
    }
  }, [isEditingStatus]);

  useEffect(() => {
    if (isEditingPriority && priorityRef.current) {
      const rect = priorityRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 120;
      setPriorityDropdownUp(rect.bottom + dropdownHeight > viewportHeight);
    }
  }, [isEditingPriority]);

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
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTaskField = async (field: 'user_ids' | 'progress' | 'priority', value: string | string[]) => {
    // Optimistic update - update local state immediately
    const optimisticTask: Task = {
      ...task,
      [field === 'progress' ? 'progress' : field === 'priority' ? 'priority' : 'user_ids']: value as any,
    };
    onUpdate(optimisticTask);

    setIsUpdating(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required');
        // Rollback
        onUpdate(task);
        return;
      }

      let res: Response;
      
      if (field === 'progress') {
        res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update_progress`, {
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
      } else if (field === 'priority') {
        res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update`, {
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
      } else {
        res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update`, {
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
      }

      if (res.ok) {
        // Optionally fetch updated task from server to ensure consistency
        const updatedTask = await res.json().catch(() => optimisticTask);
        onUpdate(updatedTask);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update task' }));
        setError(errorData.error || 'Failed to update task');
        // Rollback on error
        onUpdate(task);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Network error. Please try again.');
      // Rollback on error
      onUpdate(task);
    } finally {
      setIsUpdating(false);
      setIsEditingAssignee(false);
      setIsEditingStatus(false);
      setIsEditingPriority(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.dropdown-menu') ||
      target.closest('.editable-field') ||
      target.closest('.context-menu') ||
      target.closest('button') ||
      target.closest('select')
    ) {
      return;
    }
    onClick();
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(!showContextMenu);
  };

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    onClick();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete();
    }
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
      className="group relative bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-dark-border transition-colors duration-150 cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-2.5">
        {/* Task Name */}
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="font-medium text-gray-900 dark:text-dark-text text-sm">
            {task.task || 'Untitled Task'}
          </div>
        </div>

        {/* Assignee */}
        <div className="w-full sm:w-36 flex-shrink-0" ref={assigneeRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingAssignee(!isEditingAssignee);
              }}
              className="editable-field flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
            >
              {assignedUsers.length > 0 ? (
                <div className="flex items-center gap-1 -space-x-1">
                  {assignedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="relative"
                      title={`${user.firstName} ${user.lastName}`}
                    >
                      <div className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-dark-surface">
                        <Avatar user={user} size="sm" />
                      </div>
                    </div>
                  ))}
                  {assignedUsers.length > 3 && (
                    <div className="w-7 h-7 bg-gray-200 dark:bg-dark-border rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-dark-text border-2 border-white dark:border-dark-surface">
                      +{assignedUsers.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 dark:text-dark-text-muted">Unassigned</span>
              )}
            </div>

            {isEditingAssignee && (
              <div 
                className={`dropdown-menu absolute ${assigneeDropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] p-2 min-w-[240px] max-h-[320px] overflow-y-auto`}
              >
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
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
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
        <div className="w-28 flex-shrink-0" ref={statusRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingStatus(!isEditingStatus);
              }}
              className="editable-field inline-block px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${statusConfig[status].bgColor} ${statusConfig[status].color}`}>
                {statusConfig[status].label}
              </span>
            </div>

            {isEditingStatus && (
              <div 
                className={`dropdown-menu absolute ${statusDropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] min-w-[140px]`}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskField('progress', key);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                  >
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="w-24 flex-shrink-0" ref={priorityRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPriority(!isEditingPriority);
              }}
              className="editable-field inline-block px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${priorityConfig[priority].bgColor} ${priorityConfig[priority].color}`}>
                {priorityConfig[priority].label}
              </span>
            </div>

            {isEditingPriority && (
              <div 
                className={`dropdown-menu absolute ${priorityDropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] min-w-[120px]`}
              >
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskField('priority', key);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                  >
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${config.bgColor} ${config.color}`}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Context Menu Button */}
        <div className="w-8 flex-shrink-0 relative" ref={contextMenuRef}>
          <button
            onClick={handleContextMenuClick}
            className="context-menu p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showContextMenu && (
            <div className="context-menu absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] min-w-[140px] overflow-hidden">
              <button
                onClick={handleOpenClick}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Open
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={handleDeleteClick}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
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
