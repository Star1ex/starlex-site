import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MarkdownEditor from '@/components/TaskView/MarkdownEditor.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { taskService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { TaskDTO, CreateTaskRequest } from '@/types/dto.js';

export const TaskView: React.FC<{ taskIdProp?: string }> = ({ taskIdProp }) => {
  const params = useParams();
  const taskIdParam = taskIdProp || (params as any).taskId;
  const isNew = taskIdParam === 'new' || !taskIdParam;
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();

  // State
  const [task, setTask] = useState<Partial<TaskDTO>>({
    task: '',
    description: '',
    priority: 'medium',
    progress: 'not_started',
    folder_id: null,
  });
  // per-field saving handled by useAutoSave
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Local editing fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium');
  const [progress, setProgress] = useState<'not_started'|'in_progress'|'In review'|'done'>('not_started');

  const locationFolderId = (location.state as any)?.folder_id ?? null;

  useEffect(() => {
    if (!isNew) return;
    if (!locationFolderId) return;
    setTask((prev) => ({ ...prev, folder_id: locationFolderId }));
  }, [isNew, locationFolderId]);



  // Load task if editing
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (isNew || !taskIdParam || taskIdParam === 'new') return;
      setIsInitialLoad(true);
      try {
        const data = await taskService.getTaskById(taskIdParam as string);
        if (!mounted) return;
        setTask(data);
        setTitle(data.task || '');
        setDescription(data.description || '');
        setPriority(data.priority as any || 'medium');
        setProgress(data.progress as any || 'not_started');
      } catch (err) {
        console.error('Failed to load task', err);
      } finally {
        // allow saves after initial load
        setTimeout(() => { if (mounted) setIsInitialLoad(false); }, 10);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [taskIdParam, isNew]);

  // Combined save: debounced text + immediate state but saved together to prevent parallel requests
  const invalidTaskId = !taskIdParam || taskIdParam === 'new' || taskIdParam === '' || taskIdParam === 'without-folder';

  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 500);
  const debouncedPriority = useDebounce(priority, 300);
  const debouncedProgress = useDebounce(progress, 300);

  const [isSavingCombined, setIsSavingCombined] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSaveRef = React.useRef<number>(0);

  // Ensure we don't trigger on initial load
  useEffect(() => {
    if (!isInitialLoad) return;
    setIsInitialLoad(false);
    // We leave this early return to avoid saving immediately after loading
  }, [taskIdParam]);

  useEffect(() => {
    // Strict ID validation (first priority)
    if (invalidTaskId) {
      console.log('Skipping save - invalid task ID:', taskIdParam);
      return;
    }

    // Prevent initial-load trigger
    if (isInitialLoad) return;

    // Throttle saves: enforce minimum gap
    const now = Date.now();
    if (now - lastSaveRef.current < 300) {
      // skip if too soon
      return;
    }

    const controller = new AbortController();
    setIsSavingCombined(true);

    let cancelled = false;

    const saveTask = async () => {
      try {
        // Update core fields together (title/description/priority)
        await taskService.updateTask(taskIdParam as string, {
          task: debouncedTitle,
          description: debouncedDescription,
          priority: debouncedPriority as any,
        }, { signal: controller.signal });

        if (controller.signal.aborted) return;

        // Update progress separately with same controller
        if (debouncedProgress !== undefined && debouncedProgress !== null) {
          await taskService.updateTaskProgress(taskIdParam as string, debouncedProgress as any, { signal: controller.signal });
        }

        if (controller.signal.aborted) return;

        lastSaveRef.current = Date.now();
        setLastSaved(new Date());
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          cancelled = true;
          return;
        }
        console.error('Save failed:', err);
      } finally {
        if (!cancelled) setIsSavingCombined(false);
      }
    };

    saveTask();

    return () => {
      controller.abort();
    };
  }, [debouncedTitle, debouncedDescription, debouncedPriority, debouncedProgress, taskIdParam, isInitialLoad]);
  const isAnySaving = isSavingCombined;



  // Create new task
  const [isCreating, setIsCreating] = useState(false);
  const handleCreate = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateTaskRequest = {
        task: title,
        description: description || '',
        priority: priority,
        progress: 'not_started',
        folder_id: task.folder_id ?? null,
        owner_id: userId || '',
        team_id: null,
        user_ids: [],
      };

      const created = await taskService.createPersonalTask(payload);

      // Notify sidebar & navigate
      // (creation needs to inform other components)
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
      navigate(`/task/${created.id}`);
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setIsCreating(false);
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
        <div className="w-full px-8 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-dark-text-muted dark:hover:text-dark-text transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500 dark:text-dark-text-muted">
              {isAnySaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Saving...
                </span>
              ) : lastSaved ? (
                <span>Saved {formatRelativeTime(lastSaved)}</span>
              ) : null}
            </div>

            <div className="text-xs text-gray-400 dark:text-dark-text-muted">Markdown enabled</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-8 py-12">
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

        {/* Description - Markdown Editor */}
        <div className="mt-8 min-h-[400px]">
          <MarkdownEditor value={description} onChange={setDescription} />
        </div>

        {/* Create Button (only for new tasks) */}
        {isNew && (
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-border">
            <button onClick={handleCreate} disabled={isCreating || !title.trim()} className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{isCreating ? 'Creating...' : 'Create Task'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskView;
