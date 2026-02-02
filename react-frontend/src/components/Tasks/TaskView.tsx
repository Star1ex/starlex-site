import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { taskService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { TaskDTO, CreateTaskRequest } from '@/types/dto.js';

export const TaskView: React.FC<{ taskIdProp?: string }> = ({ taskIdProp }) => {
  const params = useParams();
  const taskIdParam = taskIdProp || (params as any).taskId;
  const isNew = taskIdParam === 'new' || !taskIdParam;
  const navigate = useNavigate();
  const { userId } = useAuth();

  // State
  const [task, setTask] = useState<Partial<TaskDTO>>({
    task: '',
    description: '',
    priority: 'medium',
    progress: 'not_started',
    folder_id: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // Local editing fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [progress, setProgress] = useState<'not_started'|'in_progress'|'In review'|'done'>('not_started');

  // Debounced values
  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 500);
  const debouncedPriority = useDebounce(priority, 500);
  const debouncedProgress = useDebounce(progress, 500);

  // Load task if editing
  useEffect(() => {
    const load = async () => {
      if (isNew) return;
      try {
        const data = await taskService.getTaskById(taskIdParam as string);
        setTask(data);
        setTitle(data.task || '');
        setDescription(data.description || '');
        setPriority(data.priority as any || 'medium');
        setProgress(data.progress as any || 'not_started');
      } catch (err) {
        console.error('Failed to load task', err);
      }
    };
    load();
  }, [taskIdParam, isNew]);

  // Auto-save when debounced values change
  useEffect(() => {
    const save = async () => {
      if (isNew) return; // Don't auto-save for new tasks
      if (!taskIdParam) return;

      setIsSaving(true);
      try {
        await taskService.updateTask(taskIdParam as string, {
          task: debouncedTitle,
          description: debouncedDescription,
          priority: debouncedPriority,
        });

        if (debouncedProgress) {
          await taskService.updateTaskProgress(taskIdParam as string, debouncedProgress as any);
        }

        setLastSaved(new Date());

        // Refresh sidebar
        window.dispatchEvent(new CustomEvent('personalTaskCreated'));
      } catch (err) {
        console.error('Auto-save failed', err);
      } finally {
        setIsSaving(false);
      }
    };

    if (!isNew && debouncedTitle !== undefined) {
      save();
    }
  }, [debouncedTitle, debouncedDescription, debouncedPriority, debouncedProgress, isNew, taskIdParam]);

  // Create new task
  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsSaving(true);
    try {
      const payload: CreateTaskRequest = {
        task: title,
        description: description || '',
        priority: priority,
        progress: 'not_started',
        folder_id: task.folder_id ?? null,
        owner_id: userId || '',
      };

      const created = await taskService.createPersonalTask(payload);

      // Notify sidebar & navigate
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
      navigate(`/task/${created.id}`);
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="task-view-container min-h-screen bg-white dark:bg-dark-surface">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm border-b border-gray-100 dark:border-dark-border">
        <div className="max-w-4xl mx-auto px-8 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {formatRelativeTime(lastSaved)}</span>
              ) : null}
            </div>

            <button onClick={() => setShowMarkdownPreview(!showMarkdownPreview)} className="text-xs px-3 py-1.5 rounded-md border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
              {showMarkdownPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Metadata Pills */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted">Priority:</span>
            <div className="flex gap-1">
              {(['low','medium','high'] as const).map((p) => (
                <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${priority === p ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-dark-border/80'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-dark-text-muted">Status:</span>
            <select value={progress} onChange={(e) => setProgress(e.target.value as any)} className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text-muted border-none outline-none cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-border/80 transition-colors">
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="In review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Title Input - Notion Style */}
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" className="w-full text-5xl font-bold text-gray-900 dark:text-dark-text placeholder-gray-300 dark:placeholder-dark-text-muted bg-transparent border-none outline-none mb-4" style={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }} />

        {/* Description - Notion Style */}
        <div className="mt-8">
          {showMarkdownPreview ? (
            <div onClick={() => setShowMarkdownPreview(false)} className="prose prose-lg dark:prose-invert max-w-none cursor-text min-h-[300px] p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border/20 transition-colors">
              {description ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
              ) : (
                <p className="text-gray-400 dark:text-dark-text-muted italic">Click to start writing...</p>
              )}
            </div>
          ) : (
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Press '/' for commands, or start typing..." className="w-full min-h-[400px] text-base text-gray-700 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted bg-transparent border-none outline-none resize-none font-normal leading-relaxed" style={{ lineHeight: 1.7, fontFamily: 'inherit' }} />
          )}
        </div>

        {/* Create Button (only for new tasks) */}
        {isNew && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
            <button onClick={handleCreate} disabled={isSaving || !title.trim()} className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{isSaving ? 'Creating...' : 'Create Task'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskView;
