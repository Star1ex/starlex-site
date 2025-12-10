// EditTaskModal.tsx - FIXED в стиле RightSidebar
import React, { useState, useCallback, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User, CreateTaskFormData } from '@/entities/types.js';
import { Token } from '@/app/api/token.js';
import { form } from 'framer-motion/client';

const getToken = () => Token.get();

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users: User[];
  onSuccess: () => void;
  teamId: string;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  task, 
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

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        task: task.task,
        description: task.description || '',
        status: task.status,
        user_ids: task.user_ids.map((u) => u.id),
      });
    }
  }, [task, isOpen]);

  const resetForm = useCallback(() => {
    setFormData({
      task: '',
      description: '',
      status: 'backlog',
      user_ids: [],
      });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !formData.task.trim()) return;
    
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/sign-in';
        return;
      }

      const res = await fetch(`/api/team/${teamId}/tasks/${task.id}/update`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          task: formData.task,
          description: formData.description,
          status: formData.status,
          user_ids: formData.user_ids, 
          priority: 'medium',
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [task, formData, teamId, onSuccess, onClose]);

  const handleDelete = useCallback(async () => {
    if (!task || !confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/sign-in';
        return;
      }

      const res = await fetch(`/api/team/${teamId}/tasks/${task.id}`, { 
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  }, [task, teamId, onSuccess, onClose]);

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-200">
          <h2 className="text-2xl font-bold mb-2">Edit Task</h2>
          <p className="text-gray-600">Update task details and assignments.</p>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          {/* Form fields same as CreateTaskModal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="edit-task-name">
              Task Name *
            </label>
            <input
              id="edit-task-name"
              required
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200"
              placeholder="Enter task name"
              disabled={isLoading}
            />
          </div>

          {/* ... rest of form same as CreateTaskModal ... */}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 flex-1 sm:flex-none order-2 sm:order-1"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Task'}
            </button>
            
            <div className="flex gap-3 flex-1 sm:flex-none order-1 sm:order-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex-1 sm:w-auto"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.task.trim()}
                className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-1 sm:w-auto min-h-[44px]"
              >
                {isLoading ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
