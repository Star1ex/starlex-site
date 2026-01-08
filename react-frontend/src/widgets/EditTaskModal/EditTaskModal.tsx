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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="p-6 sm:p-8 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-gray-900">Edit Task</h2>
              <p className="text-gray-500 text-sm">Update task details and description</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="task-name">
              Task Name *
            </label>
            <input
              id="task-name"
              required
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base transition-all duration-200"
              placeholder="Enter task name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 resize-y text-base leading-relaxed font-mono"
              placeholder="Write a detailed description for this task...&#10;&#10;Supports Markdown formatting:&#10;• **bold**&#10;• *italic*&#10;• Lists&#10;• Code blocks"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-2">Supports Markdown formatting for rich text</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base transition-all duration-200"
                disabled={isLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2" htmlFor="status">
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base transition-all duration-200"
                disabled={isLoading}
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assign Users</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {users.map((user) => {
                const isSelected = formData.user_ids.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected ? 'bg-white border-2 border-gray-300 shadow-sm' : 'hover:bg-white'
                    }`}
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
                      className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black transition-all duration-200"
                      disabled={isLoading}
                    />
                    <Avatar user={user} size="sm" />
                    <span className="font-medium text-base text-gray-900">{`${user.firstName} ${user.lastName}`}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {isDeleting ? 'Deleting...' : 'Delete Task'}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-base transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.task.trim()}
                className="px-8 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] text-base"
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