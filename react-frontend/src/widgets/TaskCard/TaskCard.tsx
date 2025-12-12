// TaskCard.tsx - With user assignment and priority
import React, { useState, useCallback } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';

const getToken = () => localStorage.getItem('token');

interface TaskCardProps {
  task: Task;
  users: User[];
  onEdit: () => void;
  onUpdate: () => void;
  teamId: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  done: { label: 'Done', color: 'bg-green-100 text-green-800' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-50 text-green-700 border-green-200' },
  medium: { label: 'Medium', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  high: { label: 'High', color: 'bg-red-50 text-red-700 border-red-200' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, users, onEdit, onUpdate, teamId }) => {
  const [status, setStatus] = useState(task.progress);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    (task.priority as 'low' | 'medium' | 'high') || 'medium'
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Initialize selected users from task prop
  React.useEffect(() => {
    // user_ids может быть массивом строк или массивом объектов
    const ids = task.user_ids?.map(u => typeof u === 'string' ? u : u.id) || [];
    console.log('Task user_ids:', task.user_ids);
    console.log('Extracted IDs:', ids);
    console.log('Available users:', users);
    setSelectedUserIds(ids);
  }, [task.user_ids, users]);

  const updateTask = useCallback(async (updates: Partial<{
    progress: string;
    priority: string;
    user_ids: string[];
  }>) => {
    setIsUpdating(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/sign-in';
        return;
      }

      const userIds = updates.user_ids !== undefined ? updates.user_ids : selectedUserIds;
      const taskPriority = updates.priority !== undefined ? updates.priority : priority;

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
          user_ids: userIds,
          priority: taskPriority,
        }),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        console.log('Task updated:', updatedTask);
        
        if (updates.priority !== undefined) {
          setPriority(updates.priority as 'low' | 'medium' | 'high');
        }
        if (updates.user_ids !== undefined) {
          setSelectedUserIds(updates.user_ids);
        }
        onUpdate();
      } else {
        console.error('Update failed:', res.status);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [task, teamId, onUpdate, priority, selectedUserIds]);

  const updateStatus = useCallback(async (newStatus: 'not_started' | 'in_progress' | 'done') => {
    setIsUpdating(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/sign-in';
        return;
      }

      const res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update_progress`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ 
          progress: newStatus, 
          task: task.task,
          description: task.description,
          user_ids: selectedUserIds
        }),
      });

      if (res.ok) {
        setStatus(newStatus);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [task, teamId, onUpdate, selectedUserIds]);

  const handleSaveAssignment = () => {
    updateTask({ user_ids: selectedUserIds });
    setShowAssignModal(false);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const assignedUsers = selectedUserIds
    .map((id) => users.find((u) => u.id === id))  
    .filter(Boolean) as User[];

  console.log('Selected User IDs:', selectedUserIds);
  console.log('Assigned Users:', assignedUsers);

  return (
    <>
      <article className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 h-full flex flex-col">
        <div className="flex justify-between items-start mb-3 gap-3">
          <h3 className="font-bold text-lg leading-tight flex-1 pr-2">{task.task}</h3>
          <div className="flex gap-2 flex-shrink-0">
            <select
              value={status}
              onChange={(e) => updateStatus(e.target.value as 'not_started' | 'in_progress' | 'done')}
              disabled={isUpdating}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 disabled:opacity-50"
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={onEdit}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200 group-hover:scale-110"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="mb-3">
          <select
            value={priority}
            onChange={(e) => updateTask({ priority: e.target.value as 'low' | 'medium' | 'high' })}
            disabled={isUpdating}
            className={`px-2 py-1 text-xs font-medium rounded-md border ${priorityConfig[priority]?.color || priorityConfig.medium.color} focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 disabled:opacity-50`}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2 flex-grow">
          {task.description}
        </p>

        {/* Assigned Users */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            {assignedUsers.length > 0 ? (
              <>
                {assignedUsers.slice(0, 3).map((user) => (
                  <Avatar key={user.id} user={user} size="sm" />
                ))}
                {assignedUsers.length > 3 && (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                    +{assignedUsers.length - 3}
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">No assignees</span>
            )}
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border-2 border-gray-300 text-gray-600 hover:border-black hover:text-black hover:bg-gray-50 transition-all duration-200"
            title="Assign users"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </article>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setShowAssignModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Assign Team Members</h3>
            <div className="space-y-2 mb-6">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                  />
                  <Avatar user={user} size="sm" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{user.firstName || user.email}</div>
                    {user.firstName && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2 px-4 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={isUpdating}
                className="flex-1 py-2 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TaskCard;