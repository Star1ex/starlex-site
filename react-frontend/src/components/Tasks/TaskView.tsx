import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { taskService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { TaskDTO, CreateTaskRequest } from '@/types/dto.js';
import { useTasks } from '@/hooks/useTasks.js';
import { showToast } from '@/shared/lib/toast.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';

const RECENT_TASKS_KEY = 'recentTasks';

const updateRecentTasks = (taskId: string, title: string) => {
  try {
    const raw = localStorage.getItem(RECENT_TASKS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Array<{ id: string; title: string; openedAt: number }>) : [];
    const filtered = parsed.filter((t) => t.id !== taskId);
    const next = [{ id: taskId, title, openedAt: Date.now() }, ...filtered].slice(0, 5);
    localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
};

export const TaskView: React.FC<{ taskIdProp?: string }> = ({ taskIdProp }) => {
  const params = useParams();
  const taskIdParam = taskIdProp || (params as any).taskId;
  const isNew = taskIdParam === 'new' || !taskIdParam;
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const tasksHook = useTasks();

  // State
  const [task, setTask] = useState<Partial<TaskDTO>>({
    task: '',
    description: '',
    priority: 'medium',
    progress: 'not_started',
    folder_id: null,
  });
  // per-field saving handled by useAutoSave

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

  const editorExtensions = useMemo(
    () => [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: 'Description',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions: editorExtensions,
    content: description || '',
    onUpdate: ({ editor: tiptap }) => {
      setDescription(tiptap.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'task-editor',
      },
    },
  });

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
        lastSentRef.current = {
          title: data.task || '',
          description: data.description || '',
          priority: (data.priority as any) || 'medium',
          progress: (data.progress as any) || 'not_started',
        };
        if (data?.id) updateRecentTasks(data.id, data.task || 'Untitled');
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

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((description || '') !== current) {
      editor.commands.setContent(description || '', false);
    }
  }, [description, editor]);

  // Combined save: debounced text + immediate state but saved together to prevent parallel requests
  const invalidTaskId = !taskIdParam || taskIdParam === 'new' || taskIdParam === '' || taskIdParam === 'without-folder';

  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 500);
  const debouncedPriority = useDebounce(priority, 300);
  const debouncedProgress = useDebounce(progress, 300);

  const [, setIsSavingCombined] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSaveRef = React.useRef<number>(0);
  const lastSentRef = React.useRef({
    title: '',
    description: '',
    priority: 'medium',
    progress: 'not_started',
  });

  useEffect(() => {
    if (invalidTaskId) return;
    window.dispatchEvent(new CustomEvent('personalTaskTitleChange', { detail: { id: taskIdParam, task: title } }));
    if (taskIdParam && title) updateRecentTasks(taskIdParam, title);
  }, [title, taskIdParam, invalidTaskId]);

  // Ensure we don't trigger on initial load
  useEffect(() => {
    if (!isInitialLoad) return;
    setIsInitialLoad(false);
    // We leave this early return to avoid saving immediately after loading
  }, [taskIdParam]);

  useEffect(() => {
    if (isInitialLoad) return;
    lastSentRef.current = {
      title,
      description,
      priority,
      progress,
    };
  }, [isInitialLoad]);

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
        const updates: Promise<void>[] = [];
        if (debouncedTitle !== lastSentRef.current.title) {
          updates.push(taskService.updateTaskTitle(taskIdParam as string, debouncedTitle, { signal: controller.signal }));
        }
        if (debouncedDescription !== lastSentRef.current.description) {
          updates.push(
            taskService.updateTaskDescription(taskIdParam as string, debouncedDescription, { signal: controller.signal })
          );
        }
        if (debouncedPriority !== lastSentRef.current.priority) {
          updates.push(taskService.updateTaskPriority(taskIdParam as string, debouncedPriority as any, { signal: controller.signal }));
        }
        if (debouncedProgress !== lastSentRef.current.progress) {
          updates.push(taskService.updateTaskStatus(taskIdParam as string, debouncedProgress as any, { signal: controller.signal }));
        }

        if (updates.length > 0) {
          await Promise.all(updates);
          if (controller.signal.aborted) return;
          lastSentRef.current = {
            title: debouncedTitle,
            description: debouncedDescription,
            priority: debouncedPriority as any,
            progress: debouncedProgress as any,
          };
          lastSaveRef.current = Date.now();
        }
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
  // Create new task
  const [isCreating, setIsCreating] = useState(false);
  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Please enter a task title');
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

      const created = await tasksHook.createTask(payload);

      // Notify sidebar & navigate
      // (creation needs to inform other components)
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
      if (created && typeof (created as TaskDTO).id === 'string') {
        navigate(`/task/${(created as TaskDTO).id}`);
      } else {
        await tasksHook.refreshTasks();
        showToast('Task created, but could not open it automatically.');
      }
    } catch (err) {
      console.error('Failed to create task', err);
      showToast('Failed to create task. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="task-view-container min-h-screen bg-white dark:bg-dark-surface">
      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 md:px-16 pt-12 sm:pt-14 md:pt-16 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <BreadcrumbBack
              label={sessionStorage.getItem('prevRouteLabel') || 'Dashboard'}
              to={sessionStorage.getItem('prevRoutePath') || '/dashboard'}
            />
          </div>
          {/* Title Input - Notion Style */}
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" className="w-full text-5xl font-bold text-gray-900 dark:text-dark-text placeholder-gray-300 dark:placeholder-dark-text-muted bg-transparent border-none outline-none mb-6" style={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }} />

          {/* Description - WYSIWYG Markdown */}
          <div className="mt-6">
            <EditorContent editor={editor} />
          </div>

          {/* Create Button (only for new tasks) */}
          {isNew && (
            <div className="mt-10">
              <button
                onClick={handleCreate}
                disabled={isCreating || !title.trim()}
                className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .task-editor {
          min-height: 360px;
          padding: 0;
          outline: none;
          border: none;
          color: inherit;
          font-size: 1rem;
          line-height: 1.7;
          background: transparent;
        }
        .task-editor p {
          margin: 0 0 0.9em 0;
        }
        .task-editor h1 {
          font-size: 2.15rem;
          font-weight: 700;
          margin: 0.6em 0 0.4em 0;
          line-height: 1.15;
        }
        .task-editor h2 {
          font-size: 1.65rem;
          font-weight: 700;
          margin: 0.7em 0 0.4em 0;
          line-height: 1.2;
        }
        .task-editor h3 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0.7em 0 0.35em 0;
          line-height: 1.25;
        }
        .task-editor ul,
        .task-editor ol {
          padding-left: 1.5em;
          margin: 0 0 0.9em 0;
        }
        .task-editor li {
          margin: 0.2em 0;
        }
        .task-editor code {
          background-color: #f3f4f6;
          padding: 0.2em 0.35em;
          border-radius: 0.25rem;
          font-size: 0.95em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }
        .task-editor pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0 0 1em 0;
        }
        .task-editor blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          margin: 0 0 1em 0;
          color: #6b7280;
        }
        .task-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        .task-editor .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .dark .task-editor code {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .dark .task-editor pre {
          background-color: #1e293b;
          color: #f1f5f9;
        }
        .dark .task-editor blockquote {
          border-left-color: #475569;
          color: #cbd5e1;
        }
        .dark .task-editor a {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
};

export default TaskView;
