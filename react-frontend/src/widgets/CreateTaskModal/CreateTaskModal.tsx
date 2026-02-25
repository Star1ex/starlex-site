// CreateTaskModal.tsx
import React, { useState, useCallback, useEffect } from 'react';
import Avatar from '@/shared/ui/Avatar.js';
import type { User, CreateTaskFormData } from '@/entities/types.js';
import { taskService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { apiClient } from '@/services/api/client.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';


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
  const { userId, refreshUser } = useAuth();

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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: 'Describe the task…',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ] as any,
    content: formData.description || '',
    onUpdate: ({ editor: tiptap }: any) => {
      setFormData((prev) => ({ ...prev, description: tiptap.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'team-task-create-editor',
      },
    },
  } as any);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((formData.description || '') !== current) {
      editor.commands.setContent(formData.description || '', { emitUpdate: false } as any);
    }
  }, [formData.description, editor]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.task.trim()) return;

    setIsLoading(true);
    try {
      // Attempt to resolve owner id, but never block submission on it.
      let ownerId = userId;
      if (!ownerId) {
        await refreshUser();
      }
      if (!ownerId) {
        const storedUser = getAuthUser();
        ownerId = storedUser?.id ?? null;
      }
      if (!ownerId) {
        const token = apiClient.getAccessToken();
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            ownerId = decoded.user_id || decoded.id || decoded.sub || null;
          } catch (err) {
            // ignore
          }
        }
      }

      if (!teamId) {
        console.error('Missing team_id in route params');
        return;
      }

      await taskService.createTeamTask(teamId, {
        task: formData.task,
        description: formData.description,
        progress: formData.progress,
        user_ids: formData.user_ids,
        owner_id: ownerId || '',
      });

      onSuccess();
      onClose();
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
    <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-[60vw] max-w-[60vw] min-w-[320px] max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-gray-900 dark:text-dark-text">Create Task</h2>
        <p className="text-gray-600 dark:text-dark-text-muted text-sm sm:text-base">Add a new task for your team.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-4 sm:space-y-6">
        {/* Task Name */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-dark-text mb-1 sm:mb-2" htmlFor="task-name">
            Task Name *
          </label>
          <input
            id="task-name"
            required
            type="text"
            value={formData.task}
            onChange={(e) => setFormData({ ...formData, task: e.target.value })}
            className="w-full px-0 py-2 bg-transparent border-0 border-b border-gray-200 dark:border-dark-border focus:outline-none focus:ring-0 text-sm sm:text-base text-gray-900 dark:text-dark-text transition-colors"
            placeholder="Enter task name"
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-dark-text mb-1 sm:mb-2" htmlFor="description">
            Description
          </label>
          <div className="mt-2">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-dark-text mb-1 sm:mb-2" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            value={formData.progress}
            onChange={(e) =>
              setFormData({ ...formData, progress: e.target.value as 'not_started' | 'in_progress' | 'done' })
            }
            className="w-full px-0 py-2 bg-transparent border-0 border-b border-gray-200 dark:border-dark-border focus:outline-none focus:ring-0 text-sm sm:text-base text-gray-900 dark:text-dark-text transition-colors"
            disabled={isLoading}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        {/* Assign Users */}
        <div>
          <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-dark-text mb-1 sm:mb-2">Assign Users</label>
          <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto p-1 sm:p-2">
            {users.map((user) => {
              const isSelected = formData.user_ids.includes(user.id);
              return (
                <label
                  key={user.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border/40 cursor-pointer transition-colors"
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
                    className="w-4 h-4 sm:w-5 sm:h-5 text-black dark:text-white border-gray-300 dark:border-dark-border rounded focus:ring-black dark:focus:ring-white"
                    disabled={isLoading}
                  />
                  <Avatar user={user} size="sm" />
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-dark-text">{`${user.firstName} ${user.lastName}`}</span>
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
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border/40 font-medium text-sm sm:text-base transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.task.trim()}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-900 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[44px] text-sm sm:text-base"
          >
            {isLoading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>

    <style>{`
      .team-task-create-editor {
        min-height: 260px;
        padding: 0;
        outline: none;
        border: none;
        color: inherit;
        font-size: 1rem;
        line-height: 1.7;
        background: transparent;
      }
      .team-task-create-editor p { margin: 0 0 0.9em 0; }
      .team-task-create-editor h1 { font-size: 1.8rem; font-weight: 700; margin: 0.6em 0 0.4em 0; line-height: 1.15; }
      .team-task-create-editor h2 { font-size: 1.45rem; font-weight: 700; margin: 0.7em 0 0.4em 0; line-height: 1.2; }
      .team-task-create-editor h3 { font-size: 1.2rem; font-weight: 700; margin: 0.7em 0 0.35em 0; line-height: 1.25; }
      .team-task-create-editor ul, .team-task-create-editor ol { padding-left: 1.5em; margin: 0 0 0.9em 0; }
      .team-task-create-editor li { margin: 0.2em 0; }
      .team-task-create-editor code { background-color: #f3f4f6; padding: 0.2em 0.35em; border-radius: 0.25rem; font-size: 0.95em; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .team-task-create-editor pre { background-color: #f3f4f6; padding: 1em; border-radius: 0.5rem; overflow-x: auto; margin: 0 0 1em 0; }
      .team-task-create-editor blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; margin: 0 0 1em 0; color: #6b7280; }
      .team-task-create-editor a { color: #2563eb; text-decoration: underline; }
      .team-task-create-editor .is-empty::before { content: attr(data-placeholder); float: left; color: #9ca3af; pointer-events: none; height: 0; }
      .dark .team-task-create-editor code { background-color: #1e293b; color: #f1f5f9; }
      .dark .team-task-create-editor pre { background-color: #1e293b; color: #f1f5f9; }
      .dark .team-task-create-editor blockquote { border-left-color: #475569; color: #cbd5e1; }
      .dark .team-task-create-editor a { color: #60a5fa; }
    `}</style>
  </div>
);

};

export default CreateTaskModal;
