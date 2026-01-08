import React from 'react';
import ReactMarkdown from 'react-markdown';
import Avatar from '@/shared/ui/Avatar.js';
import type { Task, User } from '@/entities/types.js';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  users: User[];
  onEdit: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-50 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-50 text-yellow-700' },
  high: { label: 'High', color: 'bg-red-50 text-red-700' },
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  users,
  onEdit,
}) => {
  // Defensive checks to prevent white screen
  if (!isOpen) return null;
  
  if (!task || !task.id) {
    console.error('TaskDetailModal: Invalid task provided', task);
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: Invalid task data</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe extraction with fallbacks
  const userIds = React.useMemo(() => {
    if (!task.user_ids || !Array.isArray(task.user_ids)) return [];
    try {
      return task.user_ids.map(u => typeof u === 'string' ? u : (u?.id || '')).filter(Boolean);
    } catch (err) {
      console.error('Error processing user_ids:', err);
      return [];
    }
  }, [task.user_ids]);

  const assignedUsers = React.useMemo(() => {
    if (!Array.isArray(users) || !Array.isArray(userIds)) return [];
    try {
      return userIds
        .map((id) => users.find((u) => u?.id === id))
        .filter(Boolean) as User[];
    } catch (err) {
      console.error('Error processing assigned users:', err);
      return [];
    }
  }, [userIds, users]);

  const priority = React.useMemo(() => {
    const p = task.priority as 'low' | 'medium' | 'high';
    return (p && ['low', 'medium', 'high'].includes(p)) ? p : 'medium';
  }, [task.priority]);

  const status = React.useMemo(() => {
    const s = task.progress as 'not_started' | 'in_progress' | 'done';
    return (s && ['not_started', 'in_progress', 'done'].includes(s)) ? s : 'not_started';
  }, [task.progress]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold flex-1 pr-4">{task.task}</h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Priority</div>
                <div className={`px-3 py-1.5 text-sm font-medium rounded-lg ${priorityConfig[priority].color} transition-all duration-200`}>
                  {priorityConfig[priority].label}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className={`px-3 py-1.5 text-sm font-medium rounded-lg ${statusConfig[status]?.color || statusConfig.not_started.color} transition-all duration-200`}>
                  {statusConfig[status]?.label || 'Not started'}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Assigned to</div>
                <div className="flex items-center gap-2">
                  {assignedUsers.length > 0 ? (
                    <>
                      {assignedUsers.slice(0, 3).map((user) => (
                        <div key={user.id} className="transition-transform duration-200 hover:scale-110">
                          <Avatar user={user} size="sm" />
                        </div>
                      ))}
                      {assignedUsers.length > 3 && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                          +{assignedUsers.length - 3}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No assignees</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
              {task.description ? (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{task.description}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No description provided</p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
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
        .prose h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .prose h2 {
          font-size: 1.3em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .prose h3 {
          font-size: 1.1em;
          font-weight: bold;
          margin-top: 0.8em;
          margin-bottom: 0.4em;
        }
        .prose p {
          margin-bottom: 0.8em;
        }
        .prose ul, .prose ol {
          margin-left: 1.5em;
          margin-bottom: 0.8em;
        }
        .prose li {
          margin-bottom: 0.3em;
        }
        .prose code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        .prose pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin-left: 0;
          color: #6b7280;
        }
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .prose strong {
          font-weight: 600;
        }
        .prose em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default TaskDetailModal;