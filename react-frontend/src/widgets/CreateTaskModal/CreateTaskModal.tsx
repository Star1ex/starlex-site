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
    status: 'backlog' as const,
    user_ids: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = useCallback(() => {
    setFormData({
      task: '',
      description: '',
      status: 'backlog' as const,
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
          status: formData.status,
          user_id: formData.user_ids,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold mb-2">Create Task</h2>
          <p className="text-gray-600">Add a new task for your team.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="task-name">
              Task Name *
            </label>
            <input
              id="task-name"
              required
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200"
              placeholder="Enter task name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200 resize-vertical"
              placeholder="Optional description..."
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status" 
              value={formData.status}
              onChange={(e) => setFormData({ 
                ...formData, 
                status: e.target.value as 'backlog' | 'in_progress' | 'done'
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200"
              disabled={isLoading}
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Users</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
              {users.map((user) => {
                const isSelected = formData.user_ids.includes(user.id);
                return (
                  <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const userIds = e.target.checked
                          ? [...formData.user_ids, user.id]
                          : formData.user_ids.filter((id) => id !== user.id);
                        setFormData({ ...formData, user_ids: userIds });
                      }}
                      className="w-4 h-4 text-black border-gray-300 rounded focus:ring-gray-300"
                      disabled={isLoading}
                    />
                    <Avatar user={user} size="sm" />
                    <span className="font-medium">{`${user.firstName} ${user.lastName}`}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.task.trim()}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px]"
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
