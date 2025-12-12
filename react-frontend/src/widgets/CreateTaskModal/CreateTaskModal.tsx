// CreateTaskModal.tsx - FIXED в стиле RightSidebar
import React, { useState, useCallback, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { User, CreateTaskFormData } from '@/entities/types.js';
import { Token } from '@/app/api/token.js';

const getToken = () => Token.get();

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSuccess: () => void;
  teamId: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  onSuccess, 
  teamId 
}) => {
  const [formData, setFormData] = useState<CreateTaskFormData>({
    task: '',
    description: '',
    priority: 'low' as const,
    progress: 'not_started' as const,
    user_ids: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({
      task: '',
      description: '',
      priority: 'low' as const,
      progress: 'not_started' as const,
      user_ids: [],
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task.trim()) return;
    
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/sign-in';
        return;
      }

      const res = await fetch(`/api/team/${teamId}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          task: formData.task,
          description: formData.description,
          progress: formData.progress,
          user_ids: formData.user_ids,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, teamId, onSuccess, onClose]);

  if (!isOpen) return null;

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Create Task</h2>
        <p className="text-gray-600 text-sm sm:text-base">Add a new task for your team.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
        {/* Task Name */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="task-name">
            Task Name *
          </label>
          <input
            id="task-name"
            required
            type="text"
            value={formData.task}
            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm sm:text-base transition-all duration-200"
            placeholder="Enter task name"
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200 resize-vertical text-sm sm:text-base"
            placeholder="Optional description..."
            disabled={isLoading}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={formData.progress}
            onChange={(e) =>
              setFormData({ ...formData, progress: e.target.value as 'not_started' | 'in_progress' | 'done' })
            }
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm sm:text-base transition-all duration-200"
            disabled={isLoading}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Assign Users */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Assign Users</label>
          <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 sm:p-3">
            {users.map((user) => {
              const isSelected = formData.user_ids.includes(user.id);
              return (
                <label
                  key={user.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const userIds = e.target.checked
                        ? [...formData.user_ids, user.id]
                        : formData.user_ids.filter((id) => id !== user.id);
                      setFormData({ ...formData, user_ids: userIds });
                    }}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-black border-gray-300 rounded focus:ring-gray-300"
                    disabled={isLoading}
                  />
                  <Avatar user={user} size="sm" />
                  <span className="font-medium text-sm sm:text-base">{`${user.firstName} ${user.lastName}`}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm sm:text-base transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.task.trim()}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] text-sm sm:text-base"
          >
            {isLoading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

};

export default CreateTaskModal;
