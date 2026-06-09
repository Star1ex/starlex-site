import React, { useState, useCallback, useEffect } from 'react';
import MarkdownPreview from '@/features/markdown/MarkdownPreview.js';
import type { Task, User } from '@/entities/types.js';
import { taskService } from '@/services/api/index.js';

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

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!task || !formData.task.trim()) return;

      setIsLoading(true);
      try {
        const updates: Promise<void>[] = [];
        const trimmedTitle = formData.task.trim();
        if (trimmedTitle !== (task.task || '')) {
          updates.push(taskService.updateTaskTitle(task.id, trimmedTitle));
        }
        if ((formData.description || '') !== (task.description || '')) {
          updates.push(taskService.updateTaskDescription(task.id, formData.description || ''));
        }
        if ((formData.priority || 'low') !== (task.priority || 'low')) {
          updates.push(taskService.updateTaskPriority(task.id, formData.priority));
        }
        const originalUserIds =
          task.user_ids?.map((u) => (typeof u === 'string' ? u : u.id)).filter(Boolean) || [];
        const nextUserIds = formData.user_ids || [];
        const usersChanged =
          originalUserIds.length !== nextUserIds.length ||
          originalUserIds.some((id) => !nextUserIds.includes(id));
        if (usersChanged) {
          updates.push(taskService.updateTaskAssignees(task.id, nextUserIds));
        }

        if (updates.length > 0) {
          await Promise.all(updates);
        }

        onSuccess();
        onClose();
      } catch (error) {
        // error handled
      } finally {
        setIsLoading(false);
      }
    },
    [task, formData, onSuccess, onClose]
  );

  if (!isOpen || !task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black bg-opacity-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-dark-text">Edit Task</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted mb-2" htmlFor="task-name">
              Title
            </label>
            <input
              id="task-name"
              required
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-0 py-2 border-0 border-b border-gray-200 dark:border-dark-border focus:outline-none focus:ring-0 focus:border-gray-900 dark:focus:border-white text-2xl font-medium bg-transparent text-gray-900 dark:text-dark-text transition-colors duration-200"
              placeholder="Task title"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-dark-text-muted mb-3" htmlFor="description">
              Description
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={18}
                className="w-full min-h-[320px] px-4 py-4 border border-gray-200 dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-dark-border transition-all duration-200 resize-y text-sm leading-relaxed font-mono bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text"
                placeholder="Write in Markdown..."
                disabled={isLoading}
              />
              <div className="min-h-[320px] border border-gray-200 dark:border-dark-border rounded-xl px-4 py-4 bg-gray-50/40 dark:bg-dark-border/20 overflow-y-auto">
                <div className="task-edit-preview">
                  <MarkdownPreview value={formData.description} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2 border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text rounded-full hover:bg-gray-50 dark:hover:bg-dark-border font-medium text-sm transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.task.trim()}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full font-semibold hover:bg-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[40px] text-sm"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
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
        .task-edit-preview .prose h1 {
          font-size: 1.6em;
          font-weight: 700;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .task-edit-preview .prose h2 {
          font-size: 1.35em;
          font-weight: 700;
          margin-top: 0.9em;
          margin-bottom: 0.45em;
        }
        .task-edit-preview .prose h3 {
          font-size: 1.15em;
          font-weight: 700;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
        }
        .task-edit-preview .prose p {
          margin-bottom: 0.8em;
        }
        .task-edit-preview .prose ul,
        .task-edit-preview .prose ol {
          margin-left: 1.5em;
          margin-bottom: 0.8em;
        }
        .task-edit-preview .prose li {
          margin-bottom: 0.3em;
        }
        .task-edit-preview .prose code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .task-edit-preview .prose pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .task-edit-preview .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          color: #6b7280;
        }
        .task-edit-preview .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .task-edit-preview .prose strong {
          font-weight: 600;
        }
        .task-edit-preview .prose em {
          font-style: italic;
        }
        .dark .task-edit-preview .prose code {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .dark .task-edit-preview .prose pre {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .dark .task-edit-preview .prose blockquote {
          border-left-color: #475569;
          color: #cbd5e1;
        }
        .dark .task-edit-preview .prose a {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};

export default EditTaskModal;
