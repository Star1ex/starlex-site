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

const statusConfig: Record<string, { label: string; color: string; bgColor: string; darkColor: string; darkBgColor: string }> = {
  not_started: { 
    label: 'Not started', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    darkColor: 'text-gray-400',
    darkBgColor: 'bg-gray-700/30'
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    darkColor: 'text-blue-400',
    darkBgColor: 'bg-blue-800/30'
  },
  done: { 
    label: 'Done', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    darkColor: 'text-green-400',
    darkBgColor: 'bg-green-800/30'
  },
};

const priorityConfig: Record<string, { label: string; color: string; bgColor: string; darkColor: string; darkBgColor: string }> = {
  low: { 
    label: 'Low', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50',
    darkColor: 'text-green-400',
    darkBgColor: 'bg-green-800/30'
  },
  medium: { 
    label: 'Medium', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-50',
    darkColor: 'text-yellow-400',
    darkBgColor: 'bg-yellow-800/30'
  },
  high: { 
    label: 'High', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50',
    darkColor: 'text-red-400',
    darkBgColor: 'bg-red-800/30'
  },
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
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const assigneeSearchRef = useRef<HTMLInputElement>(null);

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

  // Filter users for assignee dropdown
  const filteredUsersForAssignee = React.useMemo(() => {
    if (!assigneeSearchQuery.trim()) return users;
    const query = assigneeSearchQuery.toLowerCase().trim();
    return users.filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [users, assigneeSearchQuery]);

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

  // Reset search query when dropdown closes
  useEffect(() => {
    if (!isEditingAssignee) {
      setAssigneeSearchQuery('');
    }
  }, [isEditingAssignee]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isEditingAssignee && assigneeSearchRef.current) {
      setTimeout(() => {
        assigneeSearchRef.current?.focus();
      }, 100);
    }
  }, [isEditingAssignee]);

  // Close dropdowns when clicking outside (desktop and mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const dropdown = (event.target as HTMLElement)?.closest('.dropdown-menu');
      
      if (isEditingAssignee && assigneeRef.current && !assigneeRef.current.contains(target) && !dropdown) {
        setIsEditingAssignee(false);
      }
      if (isEditingStatus && statusRef.current && !statusRef.current.contains(target) && !dropdown) {
        setIsEditingStatus(false);
      }
      if (isEditingPriority && priorityRef.current && !priorityRef.current.contains(target) && !dropdown) {
        setIsEditingPriority(false);
      }
      if (showContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setShowContextMenu(false);
      }
    };

    if (isEditingAssignee || isEditingStatus || isEditingPriority || showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isEditingAssignee, isEditingStatus, isEditingPriority, showContextMenu]);

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
      className="group relative bg-transparent dark:bg-transparent hover:bg-gray-50/50 dark:hover:bg-dark-border/30 transition-colors duration-150 cursor-pointer"
    >
      <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 min-w-[600px] sm:min-w-0">
        {/* Task Name */}
        <div className="flex-1 min-w-[120px] sm:min-w-[200px] max-w-[200px] sm:max-w-none">
          <div className="font-medium text-gray-900 dark:text-dark-text text-xs sm:text-sm leading-tight truncate" title={task.task || 'Untitled Task'}>
            {task.task || 'Untitled Task'}
          </div>
        </div>

        {/* Assignee */}
        <div className="flex-shrink-0 min-w-[80px] sm:min-w-[100px]" ref={assigneeRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingAssignee(!isEditingAssignee);
              }}
              className="editable-field flex items-center justify-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
            >
              {assignedUsers.length > 0 ? (
                <div className="flex items-center gap-1 -space-x-1.5">
                  {assignedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="relative"
                      title={`${user.firstName} ${user.lastName}`}
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-white dark:ring-dark-surface">
                        <Avatar user={user} size="sm" />
                      </div>
                    </div>
                  ))}
                  {assignedUsers.length > 3 && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 dark:bg-dark-border rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium text-gray-600 dark:text-dark-text ring-2 ring-white dark:ring-dark-surface">
                      +{assignedUsers.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-dark-text-muted whitespace-nowrap">—</span>
              )}
            </div>

            {isEditingAssignee && (
              <div 
                className={`dropdown-menu fixed sm:absolute ${assigneeDropdownUp ? 'bottom-auto top-0' : 'top-auto bottom-0'} sm:${assigneeDropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 sm:left-auto sm:right-0 sm:w-auto w-full sm:min-w-[280px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[100] overflow-hidden max-h-[60vh] sm:max-h-[400px] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-surface">
                  <input
                    ref={assigneeSearchRef}
                    type="text"
                    placeholder="Search users..."
                    value={assigneeSearchQuery}
                    onChange={(e) => {
                      e.stopPropagation();
                      setAssigneeSearchQuery(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                {/* Users List */}
                <div className="overflow-y-auto p-2 space-y-1">
                  {filteredUsersForAssignee.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-dark-text-muted">
                      {assigneeSearchQuery ? 'No users found' : 'No users available'}
                    </div>
                  ) : (
                    filteredUsersForAssignee.map((user) => {
                      const isSelected = userIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleUserAssignment(user.id);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isSelected 
                              ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800' 
                              : 'hover:bg-gray-100 dark:hover:bg-dark-border border border-transparent'
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <Avatar user={user} size="sm" />
                            {isSelected && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-white dark:border-dark-surface flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-300' : 'text-gray-900 dark:text-dark-text'}`}>
                              {user.firstName} {user.lastName}
                            </div>
                            {user.email && (
                              <div className="text-xs text-gray-500 dark:text-dark-text-muted truncate">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 min-w-[90px] sm:min-w-[100px]" ref={statusRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingStatus(!isEditingStatus);
              }}
              className="editable-field inline-block px-1 sm:px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
            >
              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-md whitespace-nowrap ${statusConfig[status].bgColor} dark:${statusConfig[status].darkBgColor} ${statusConfig[status].color} dark:${statusConfig[status].darkColor}`}>
                {statusConfig[status].label}
              </span>
            </div>

            {isEditingStatus && (
              <div 
                className={`dropdown-menu fixed sm:absolute ${statusDropdownUp ? 'bottom-auto top-0' : 'top-auto bottom-0'} sm:${statusDropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 sm:left-0 sm:right-auto sm:w-auto w-full sm:min-w-[140px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[100]`}
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskField('progress', key);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-border first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                  >
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${config.bgColor} dark:${config.darkBgColor} ${config.color} dark:${config.darkColor}`}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="flex-shrink-0 min-w-[70px] sm:min-w-[80px]" ref={priorityRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPriority(!isEditingPriority);
              }}
              className="editable-field inline-block px-1 sm:px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
            >
              <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-md whitespace-nowrap ${priorityConfig[priority].bgColor} dark:${priorityConfig[priority].darkBgColor} ${priorityConfig[priority].color} dark:${priorityConfig[priority].darkColor}`}>
                {priorityConfig[priority].label}
              </span>
            </div>

            {isEditingPriority && (
              <div 
                className={`dropdown-menu fixed sm:absolute ${priorityDropdownUp ? 'bottom-auto top-0' : 'top-auto bottom-0'} sm:${priorityDropdownUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 right-0 sm:left-0 sm:right-auto sm:w-auto w-full sm:min-w-[120px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[100]`}
              >
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskField('priority', key);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-dark-border first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                  >
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${config.bgColor} dark:${config.darkBgColor} ${config.color} dark:${config.darkColor}`}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Context Menu Button */}
        <div className="flex-shrink-0 min-w-[28px] sm:min-w-[32px] relative" ref={contextMenuRef}>
          <button
            onClick={handleContextMenuClick}
            className="context-menu p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showContextMenu && (
            <div className="context-menu fixed sm:absolute top-auto bottom-0 sm:top-full sm:bottom-auto right-0 sm:right-0 mt-0 sm:mt-2 mb-2 sm:mb-0 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[100] w-full sm:w-auto sm:min-w-[140px] overflow-hidden"
            >
              <button
                onClick={handleOpenClick}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Open
              </button>
              <div className="border-t border-gray-100 dark:border-dark-border" />
              <button
                onClick={handleDeleteClick}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
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
        <div className="absolute inset-0 bg-white/80 dark:bg-dark-bg/80 flex items-center justify-center z-10">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute top-2 right-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs z-20 shadow-md">
          {error}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
            }}
            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
