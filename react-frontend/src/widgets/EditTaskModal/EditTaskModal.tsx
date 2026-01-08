import React, { useState, useCallback, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';
import { Token } from '@/app/api/token.js';

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
  teamId,
}) => {
  const [formData, setFormData] = useState({
    task: '',
    description: '',
    priority: 'low' as 'low' | 'medium' | 'high',
    progress: 'not_started' as 'not_started' | 'in_progress' | 'done',
    user_ids: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      const userIds = task.user_ids?.map((u) => (typeof u === 'string' ? u : u.id)) || [];
      setFormData({
        task: task.task || '',
        description: task.description || '',
        priority: (task.priority as 'low' | 'medium' | 'high') || 'low',
        progress: task.progress || 'not_started',
        user_ids: userIds,
      });
    }
  }, [task, isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
            priority: formData.priority,
            user_ids: formData.user_ids,
          }),
        });

        if (res.ok) {
          const progressRes = await fetch(`/api/team/${teamId}/tasks/${task.id}/update_progress`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
            body: JSON.stringify({
              progress: formData.progress,
              task: formData.task,
              description: formData.description,
              user_ids: formData.user_ids,
            }),
          });

          if (progressRes.ok) {
            onSuccess();
            onClose();
          }
        }
      } catch (error) {
        console.error('Failed to update task:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [task, formData, teamId, onSuccess, onClose]
  );

  const handleDelete = useCallback(async () => {
    if (!task || !confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
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
      setIsDeleting(false);
    }
  }, [task, teamId, onSuccess, onClose]);

  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="p-6 sm:p-8 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Edit Task</h2>
          <p className="text-gray-600 text-sm sm:text-base">Update task details.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 sm:space-y-6">
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

          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all duration-200 resize-vertical text-sm sm:text-base"
              placeholder="Task description (supports Markdown)..."
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Supports Markdown formatting</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm sm:text-base transition-all duration-200"
                disabled={isLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    progress: e.target.value as 'not_started' | 'in_progress' | 'done',
                  })
                }
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 text-sm sm:text-base transition-all duration-200"
                disabled={isLoading}
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Assign Users</label>
            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-2 sm:p-3">
              {users.map((user) => {
                const isSelected = formData.user_ids.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200"
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
                      className="w-4 h-4 sm:w-5 sm:h-5 text-black border-gray-300 rounded focus:ring-gray-300 transition-all duration-200"
                      disabled={isLoading}
                    />
                    <Avatar user={user} size="sm" />
                    <span className="font-medium text-sm sm:text-base">{`${user.firstName} ${user.lastName}`}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 text-sm sm:text-base"
            >
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </button>

            <div className="flex gap-2 sm:gap-3">
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
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] text-sm sm:text-base hover:scale-105"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EditTaskModal;