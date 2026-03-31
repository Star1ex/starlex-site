import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';
import { taskService } from '@/services/api/index.js';

interface TaskCardProps {
  task: Task;
  users: User[];
  onUpdate: (updatedTask: Task) => void;
  onClick: () => void;
  onDelete: () => void;
  teamId: string;
}

const statusConfig: Record<string, { label: string; dot: string; color: string; bgColor: string }> = {
  not_started: {
    label: 'Not started',
    dot: '#94a3b8',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800/40',
  },
  in_progress: {
    label: 'In Progress',
    dot: '#3b82f6',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
  },
  done: {
    label: 'Done',
    dot: '#22c55e',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
  },
};

const priorityConfig: Record<string, { label: string; dot: string; color: string; bgColor: string }> = {
  low: {
    label: 'Low',
    dot: '#22c55e',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
  },
  medium: {
    label: 'Medium',
    dot: '#f59e0b',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
  },
  high: {
    label: 'High',
    dot: '#ef4444',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
  },
};

const DROPDOWN_ANIMATION_MS = 240;

const TaskCardComponent: React.FC<TaskCardProps> = ({
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.task || '');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigneeDropdownVisible, setAssigneeDropdownVisible] = useState(false);
  const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
  const [priorityDropdownVisible, setPriorityDropdownVisible] = useState(false);
  const [assigneeDropdownClosing, setAssigneeDropdownClosing] = useState(false);
  const [statusDropdownClosing, setStatusDropdownClosing] = useState(false);
  const [priorityDropdownClosing, setPriorityDropdownClosing] = useState(false);
  const [assigneeDropdownUp, setAssigneeDropdownUp] = useState(false);
  const [statusDropdownUp, setStatusDropdownUp] = useState(false);
  const [priorityDropdownUp, setPriorityDropdownUp] = useState(false);
  const [assigneeDropdownPosition, setAssigneeDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [statusDropdownPosition, setStatusDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [priorityDropdownPosition, setPriorityDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [isMobileView, setIsMobileView] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));
  const [swipeOffset, setSwipeOffset] = useState(0);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const contextMenuPanelRef = useRef<HTMLDivElement>(null);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const assigneeCloseTimeoutRef = useRef<number | null>(null);
  const statusCloseTimeoutRef = useRef<number | null>(null);
  const priorityCloseTimeoutRef = useRef<number | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const longPressTimeoutRef = useRef<number | null>(null);
  const touchMovedRef = useRef(false);
  const contextMenuWidth = 180;
  const contextMenuHeight = 112;
  const contextMenuPadding = 8;

  useEffect(() => {
    setTitleDraft(task.task || '');
  }, [task.id, task.task]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isRenaming) return;
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [isRenaming]);

  useEffect(() => {
    if (isEditingAssignee) {
      if (assigneeCloseTimeoutRef.current) {
        window.clearTimeout(assigneeCloseTimeoutRef.current);
        assigneeCloseTimeoutRef.current = null;
      }
      setAssigneeDropdownVisible(true);
      setAssigneeDropdownClosing(false);
      return;
    }

    if (assigneeDropdownVisible) {
      setAssigneeDropdownClosing(true);
      assigneeCloseTimeoutRef.current = window.setTimeout(() => {
        setAssigneeDropdownVisible(false);
        setAssigneeDropdownClosing(false);
        setAssigneeDropdownPosition(null);
      }, DROPDOWN_ANIMATION_MS);
    }
  }, [isEditingAssignee, assigneeDropdownVisible]);

  useEffect(() => {
    if (isEditingStatus) {
      if (statusCloseTimeoutRef.current) {
        window.clearTimeout(statusCloseTimeoutRef.current);
        statusCloseTimeoutRef.current = null;
      }
      setStatusDropdownVisible(true);
      setStatusDropdownClosing(false);
      return;
    }

    if (statusDropdownVisible) {
      setStatusDropdownClosing(true);
      statusCloseTimeoutRef.current = window.setTimeout(() => {
        setStatusDropdownVisible(false);
        setStatusDropdownClosing(false);
        setStatusDropdownPosition(null);
      }, DROPDOWN_ANIMATION_MS);
    }
  }, [isEditingStatus, statusDropdownVisible]);

  useEffect(() => {
    if (isEditingPriority) {
      if (priorityCloseTimeoutRef.current) {
        window.clearTimeout(priorityCloseTimeoutRef.current);
        priorityCloseTimeoutRef.current = null;
      }
      setPriorityDropdownVisible(true);
      setPriorityDropdownClosing(false);
      return;
    }

    if (priorityDropdownVisible) {
      setPriorityDropdownClosing(true);
      priorityCloseTimeoutRef.current = window.setTimeout(() => {
        setPriorityDropdownVisible(false);
        setPriorityDropdownClosing(false);
        setPriorityDropdownPosition(null);
      }, DROPDOWN_ANIMATION_MS);
    }
  }, [isEditingPriority, priorityDropdownVisible]);

  useEffect(() => {
    return () => {
      if (assigneeCloseTimeoutRef.current) window.clearTimeout(assigneeCloseTimeoutRef.current);
      if (statusCloseTimeoutRef.current) window.clearTimeout(statusCloseTimeoutRef.current);
      if (priorityCloseTimeoutRef.current) window.clearTimeout(priorityCloseTimeoutRef.current);
    };
  }, []);

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

  const handleTitleChange = async (next: string) => {
    setTitleDraft(next);
    onUpdate({ ...task, task: next });
    try {
      await taskService.updateTeamTaskTitle(teamId, task.id, next);
    } catch (err) {
      console.error('Failed to update task title:', err);
    }
  };

  // Calculate dropdown position - anchor to task card, prefer opening downward
  useEffect(() => {
    if (isEditingAssignee && assigneeRef.current) {
      const rect = assigneeRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 400;
      const dropdownWidth = 280;
      
      // Prefer opening downward, only flip up if absolutely necessary
      let top = rect.bottom + 8;
      let left = rect.left;
      
      // Only flip upward if there's not enough space below AND there's more space above
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < dropdownHeight + 8 && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 8;
        setAssigneeDropdownUp(true);
      } else {
        setAssigneeDropdownUp(false);
        // Ensure dropdown doesn't overflow bottom
        if (top + dropdownHeight > viewportHeight - 16) {
          top = viewportHeight - dropdownHeight - 16;
        }
      }
      
      // Align to left edge of trigger, ensure it stays within viewport
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
      
      setAssigneeDropdownPosition({ top, left });
    }
  }, [isEditingAssignee]);

  // Calculate status dropdown position
  useEffect(() => {
    if (isEditingStatus && statusRef.current) {
      const rect = statusRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 150;
      const dropdownWidth = 140;
      
      let top = rect.bottom + 8;
      let left = rect.left;
      
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < dropdownHeight + 8 && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 8;
        setStatusDropdownUp(true);
      } else {
        setStatusDropdownUp(false);
        if (top + dropdownHeight > viewportHeight - 16) {
          top = viewportHeight - dropdownHeight - 16;
        }
      }
      
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
      
      setStatusDropdownPosition({ top, left });
    }
  }, [isEditingStatus]);

  // Calculate priority dropdown position
  useEffect(() => {
    if (isEditingPriority && priorityRef.current) {
      const rect = priorityRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 120;
      const dropdownWidth = 120;
      
      let top = rect.bottom + 8;
      let left = rect.left;
      
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < dropdownHeight + 8 && spaceAbove > spaceBelow) {
        top = rect.top - dropdownHeight - 8;
        setPriorityDropdownUp(true);
      } else {
        setPriorityDropdownUp(false);
        if (top + dropdownHeight > viewportHeight - 16) {
          top = viewportHeight - dropdownHeight - 16;
        }
      }
      
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }
      
      setPriorityDropdownPosition({ top, left });
    }
  }, [isEditingPriority]);


  // Close context menu when clicking outside (backdrop handles other dropdowns)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (showContextMenu) {
        const inButton = contextMenuRef.current?.contains(target) ?? false;
        const inPanel = contextMenuPanelRef.current?.contains(target) ?? false;
        if (!inButton && !inPanel) {
          setShowContextMenu(false);
          setContextMenuPosition(null);
        }
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showContextMenu]);

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
      if (field === 'progress') {
        await taskService.updateTeamTaskStatus(teamId, task.id, value as any);
      } else if (field === 'priority') {
        await taskService.updateTeamTaskPriority(teamId, task.id, value as any);
      } else {
        await taskService.updateTeamTaskAssignees(teamId, task.id, value as string[]);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      setError('Failed to update task. Please try again.');
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
      target.closest('select')
    ) {
      return;
    }
    if (isMobileView && swipeOffset !== 0) {
      setSwipeOffset(0);
      return;
    }
    onClick();
  };

  const openContextMenuAt = (x: number, y: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = x;
    let top = y;

    if (left + contextMenuWidth > viewportWidth - contextMenuPadding) {
      left = viewportWidth - contextMenuWidth - contextMenuPadding;
    }
    if (left < contextMenuPadding) {
      left = contextMenuPadding;
    }

    if (top + contextMenuHeight > viewportHeight - contextMenuPadding) {
      top = Math.max(contextMenuPadding, top - contextMenuHeight - contextMenuPadding);
    }

    setContextMenuPosition({ top, left });
    setShowContextMenu(true);
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showContextMenu) {
      setShowContextMenu(false);
      setContextMenuPosition(null);
      return;
    }
    const rect = contextMenuRef.current?.getBoundingClientRect();
    if (rect) {
      openContextMenuAt(rect.right - contextMenuWidth, rect.bottom + 6);
      return;
    }
    openContextMenuAt(e.clientX, e.clientY);
  };

  const handleCardContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLElement;
    if (
      target.closest('.dropdown-menu') ||
      target.closest('.editable-field') ||
      target.closest('.context-menu') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }
    openContextMenuAt(e.clientX, e.clientY);
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileView) return;
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchMovedRef.current = false;
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
    }
    longPressTimeoutRef.current = window.setTimeout(() => {
      if (!touchMovedRef.current) {
        openContextMenuAt(touch.clientX, touch.clientY);
      }
    }, 520);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobileView) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (Math.abs(deltaY) > 10) {
      touchMovedRef.current = true;
      if (longPressTimeoutRef.current) window.clearTimeout(longPressTimeoutRef.current);
    }

    if (deltaX < -10 && Math.abs(deltaY) < 30) {
      touchMovedRef.current = true;
      if (longPressTimeoutRef.current) window.clearTimeout(longPressTimeoutRef.current);
      setSwipeOffset(Math.max(deltaX, -88));
    }
  };

  const handleTouchEnd = () => {
    if (!isMobileView) return;
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
    }
    if (swipeOffset < -60) {
      setSwipeOffset(-88);
    } else {
      setSwipeOffset(0);
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
      onContextMenu={handleCardContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="group relative rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-px"
      style={{ background: 'var(--bg-secondary)', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)' }}
    >
      {isMobileView && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            setSwipeOffset(0);
          }}
          className="absolute right-0 top-0 bottom-0 w-16 bg-red-500 text-white text-xs font-semibold flex items-center justify-center"
        >
          Delete
        </button>
      )}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{ background: priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#22c55e' }}
      />
      <div
        className="flex items-center gap-2.5 px-3 py-3 pl-4 min-w-0 md:min-w-[540px] transition-transform duration-200"
        style={isMobileView ? { transform: `translateX(${swipeOffset}px)` } : undefined}
      >
        {/* Task Name */}
        <div className="flex-1 min-w-[120px] sm:min-w-[180px] max-w-[180px] sm:max-w-none">
          {isRenaming ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsRenaming(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setTitleDraft(task.task || '');
                  setIsRenaming(false);
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setIsRenaming(false);
                }
              }}
              className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm font-medium text-gray-900 dark:text-dark-text"
            />
          ) : (
            <div
              className="font-medium text-gray-900 dark:text-dark-text text-xs sm:text-sm leading-tight truncate"
              title={task.task || 'Untitled Task'}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
            >
              {task.task || 'Untitled Task'}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="flex-shrink-0 min-w-[72px] sm:min-w-[88px]" ref={assigneeRef}>
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

            {assigneeDropdownVisible && assigneeDropdownPosition && createPortal(
              <>
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 bg-black/10 dark:bg-black/30 z-[9998] dropdown-overlay"
                  data-state={assigneeDropdownClosing ? 'closed' : 'open'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingAssignee(false);
                  }}
                />
                {/* Dropdown menu */}
                <div 
                  ref={assigneeDropdownRef}
                  className="fixed bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[9999] overflow-hidden w-[280px] max-h-[400px] flex flex-col dropdown-panel"
                  data-state={assigneeDropdownClosing ? 'closed' : 'open'}
                  data-direction={assigneeDropdownUp ? 'up' : 'down'}
                  style={{
                    top: `${assigneeDropdownPosition.top}px`,
                    left: `${assigneeDropdownPosition.left}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Users List */}
                  <div className="overflow-y-auto p-2 space-y-1">
                  {users.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-dark-text-muted">
                      No users available
                    </div>
                  ) : (
                    users.map((user) => {
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
              </>,
              document.body
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 min-w-[80px] sm:min-w-[90px]" ref={statusRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingStatus(!isEditingStatus);
              }}
              className="editable-field inline-block px-1 sm:px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
            >
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap ${statusConfig[status].bgColor} ${statusConfig[status].color}`}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusConfig[status].dot }} />
                {statusConfig[status].label}
              </span>
            </div>

            {statusDropdownVisible && statusDropdownPosition && createPortal(
              <>
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 bg-black/10 dark:bg-black/30 z-[9998] dropdown-overlay"
                  data-state={statusDropdownClosing ? 'closed' : 'open'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingStatus(false);
                  }}
                />
                {/* Dropdown menu */}
                <div 
                  className="fixed bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[9999] min-w-[140px] dropdown-panel"
                  data-state={statusDropdownClosing ? 'closed' : 'open'}
                  data-direction={statusDropdownUp ? 'up' : 'down'}
                  style={{
                    top: `${statusDropdownPosition.top}px`,
                    left: `${statusDropdownPosition.left}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
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
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap ${config.bgColor} ${config.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.dot }} />
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="flex-shrink-0 min-w-[64px] sm:min-w-[72px]" ref={priorityRef}>
          <div className="relative">
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPriority(!isEditingPriority);
              }}
              className="editable-field inline-block px-1 sm:px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
            >
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap ${priorityConfig[priority].bgColor} ${priorityConfig[priority].color}`}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityConfig[priority].dot }} />
                {priorityConfig[priority].label}
              </span>
            </div>

            {priorityDropdownVisible && priorityDropdownPosition && createPortal(
              <>
                {/* Backdrop overlay */}
                <div 
                  className="fixed inset-0 bg-black/10 dark:bg-black/30 z-[9998] dropdown-overlay"
                  data-state={priorityDropdownClosing ? 'closed' : 'open'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingPriority(false);
                  }}
                />
                {/* Dropdown menu */}
                <div 
                  className="fixed bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[9999] min-w-[120px] dropdown-panel"
                  data-state={priorityDropdownClosing ? 'closed' : 'open'}
                  data-direction={priorityDropdownUp ? 'up' : 'down'}
                  style={{
                    top: `${priorityDropdownPosition.top}px`,
                    left: `${priorityDropdownPosition.left}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
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
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap ${config.bgColor} ${config.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.dot }} />
                        {config.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>,
              document.body
            )}
          </div>
        </div>

        {/* Context Menu Button */}
        <div className="flex-shrink-0 min-w-[28px] sm:min-w-[30px] relative" ref={contextMenuRef}>
          <button
            onClick={handleContextMenuClick}
            className="context-menu p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors opacity-30 sm:group-hover:opacity-100"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {showContextMenu && contextMenuPosition && createPortal(
            <div
              ref={contextMenuPanelRef}
              className="context-menu fixed bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-2xl z-[10000] w-[180px] overflow-hidden"
              style={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
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
            </div>,
            document.body
          )}
        </div>
      </div>

      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl" style={{ background: 'var(--bg-secondary)', opacity: 0.8 }}>
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

const TaskCard = React.memo(TaskCardComponent);
TaskCard.displayName = 'TaskCard';
export default TaskCard;
