import React, { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import MarkdownPreview from '@/features/markdown/MarkdownPreview.js';
import type { Task, User } from '@/entities/types.js';
import { taskService } from '@/services/api/index.js';
import { Glass } from '@/shared/ui/glass/index.js';

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
      } catch {
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
      className="product-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <Glass
        variant="modal"
        depth="floating"
        className="product-modal-shell rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp"
      >
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-semibold text-[color:var(--sx-text)]">Edit Task</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-surface-hover)] rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" strokeWidth={1.55} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-6">
          <div>
            <label className="block label-caps mb-2" htmlFor="task-name">
              Title
            </label>
            <input
              id="task-name"
              required
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-0 py-2 border-0 border-b border-[color:var(--sx-line)] focus:outline-none focus:ring-0 focus:border-[color:var(--sx-text-muted)] text-2xl font-medium bg-transparent text-[color:var(--sx-text)] transition-colors duration-200"
              placeholder="Task title"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block label-caps mb-3" htmlFor="description">
              Description
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={18}
                className="w-full min-h-[320px] px-4 py-4 border border-[color:var(--sx-line)] rounded-xl focus:outline-none focus:shadow-[var(--sx-focus-ring)] focus:border-transparent transition-all duration-200 resize-y text-sm leading-relaxed font-mono bg-[color:var(--sx-surface)] text-[color:var(--sx-text)] placeholder:text-[color:var(--sx-text-disabled)]"
                placeholder="Write in Markdown..."
                disabled={isLoading}
              />
              <div className="min-h-[320px] border border-[color:var(--sx-line)] rounded-xl px-4 py-4 bg-[color:var(--sx-surface)] overflow-y-auto">
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
              className="liquid-button px-5 py-2 rounded-full font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.task.trim()}
              className="px-6 py-2 bg-[color:var(--starlex-accent)] text-[color:var(--starlex-accent-contrast)] rounded-full font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[40px] text-sm"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Glass>

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
          color: var(--priority-low-text);
        }
      `}</style>
    </div>
  );
};

export default EditTaskModal;
