import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronDown, Layers } from 'lucide-react';
import { useDebounce } from '@/shared/hooks/useDebounce.js';
import { taskService, userService } from '@/services/api/index.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import type { CreateTaskRequest, TaskDTO, WorkspaceDTO } from '@/types/dto.js';
import { useTasks } from '@/hooks/useTasks.js';
import { showToast } from '@/shared/lib/toast.js';
import BreadcrumbBack from '@/shared/ui/BreadcrumbBack.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { IconPicker } from '@/shared/ui/IconPicker.js';

const MarkdownEditor = React.lazy(() =>
  import('@/features/markdown/RichEditor.js').then((m) => ({ default: m.MarkdownEditor }))
);

const updateRecentTasks = (taskId: string, title: string) => {
  trackItem({ id: taskId, name: title, url: `/task/${taskId}`, type: 'task' });
};

// ─── workspace picker ────────────────────────────────────────────────────────

interface WorkspacePickerProps {
  workspaces: WorkspaceDTO[];
  selectedId: string | null;
  onChange: (id: string) => void;
  error?: boolean;
}

const WorkspacePicker: React.FC<WorkspacePickerProps> = ({ workspaces, selectedId, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = workspaces.find(w => w.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          error ? 'ring-1 ring-red-400' : ''
        }`}
        style={{
          background: 'var(--bg-secondary)',
          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
        }}
      >
        <Layers size={13} style={{ opacity: 0.7 }} />
        <span>{selected?.name ?? 'Select workspace…'}</span>
        <ChevronDown size={12} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-30 rounded-xl shadow-xl py-1 min-w-[200px]"
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        >
          {workspaces.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              No workspaces found
            </p>
          )}
          {workspaces.map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => { onChange(w.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
              style={{
                color: w.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: w.id === selectedId ? 'var(--bg-secondary)' : 'transparent',
                fontWeight: w.id === selectedId ? 500 : 400,
              }}
              onMouseEnter={e => { if (w.id !== selectedId) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (w.id !== selectedId) e.currentTarget.style.background = 'transparent'; }}
            >
              {w.icon ? <span className="text-sm leading-none">{w.icon}</span> : <Layers size={12} style={{ opacity: 0.5 }} />}
              <span className="truncate">{w.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── main component ──────────────────────────────────────────────────────────

export const TaskView: React.FC<{ taskIdProp?: string }> = ({ taskIdProp }) => {
  const params = useParams();
  const taskIdParam = taskIdProp || (params as any).taskId;
  const isNew = taskIdParam === 'new' || !taskIdParam;
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [searchParams] = useSearchParams();
  const tasksHook = useTasks();

  const locationState = location.state as Record<string, unknown> | null;

  // ── new-task workspace / project context ──
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    (locationState?.workspace_id as string)
    ?? searchParams.get('workspaceId')
    ?? activeWorkspaceId
    ?? null
  );
  const [projectId] = useState<string | null>(
    (locationState?.project_id as string) ?? null
  );
  const [workspaces, setWorkspaces] = useState<WorkspaceDTO[] | null>(null);
  const [workspacePickerError, setWorkspacePickerError] = useState(false);

  // Lazily load workspaces when creating a new task and no workspace preset
  useEffect(() => {
    if (!isNew) return;
    if (workspaceId) return; // already have one from context/query/state
    let cancelled = false;
    userService.getWorkspaces().then(ws => {
      if (cancelled) return;
      setWorkspaces(ws);
      if (ws.length === 1) setWorkspaceId(ws[0].id);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isNew, workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── task editing state ──
  const [task, setTask] = useState<Partial<TaskDTO>>({
    task: '',
    description: '',
    priority: 'medium',
    progress: 'not_started',
    folder_id: null,
  });
  const [title, setTitle] = useState('');
  useDocumentTitle(title || (isNew ? 'New Task' : null));
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [progress, setProgress] = useState<'not_started' | 'in_progress' | 'done'>('not_started');

  const locationFolderId = locationState?.folder_id as string | null ?? null;

  useEffect(() => {
    if (!isNew || !locationFolderId) return;
    setTask(prev => ({ ...prev, folder_id: locationFolderId }));
  }, [isNew, locationFolderId]);

  // ── load task when editing ──
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
        setIcon(data.icon || '');
        setDescription(data.description || '');
        setPriority((data.priority as any) || 'medium');
        setProgress((data.progress as any) || 'not_started');
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
        setTimeout(() => { if (mounted) setIsInitialLoad(false); }, 10);
      }
    };
    load();
    return () => { mounted = false; };
  }, [taskIdParam, isNew]);

  // ── auto-save for existing tasks ──
  const invalidTaskId = !taskIdParam || taskIdParam === 'new' || taskIdParam === '' || taskIdParam === 'without-folder';

  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 400);
  const debouncedPriority = useDebounce(priority, 300);
  const debouncedProgress = useDebounce(progress, 300);

  const [, setIsSavingCombined] = useState(false);
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

  useEffect(() => {
    if (invalidTaskId || isInitialLoad) return;

    if (
      debouncedTitle !== title ||
      debouncedDescription !== description ||
      debouncedPriority !== priority ||
      debouncedProgress !== progress
    ) return;

    if (
      debouncedTitle === lastSentRef.current.title &&
      debouncedDescription === lastSentRef.current.description &&
      debouncedPriority === lastSentRef.current.priority &&
      debouncedProgress === lastSentRef.current.progress
    ) return;

    const now = Date.now();
    if (now - lastSaveRef.current < 300) return;

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
          updates.push(taskService.updateTaskDescription(taskIdParam as string, debouncedDescription, { signal: controller.signal }));
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
        if (err?.name === 'AbortError') { cancelled = true; return; }
        console.error('Save failed:', err);
      } finally {
        if (!cancelled) setIsSavingCombined(false);
      }
    };

    saveTask();
    return () => { controller.abort(); };
  }, [
    debouncedTitle, debouncedDescription, debouncedPriority, debouncedProgress,
    title, description, priority, progress,
    taskIdParam, isInitialLoad, invalidTaskId,
  ]);

  // ── create new task ──
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Please enter a task title');
      return;
    }
    if (!workspaceId) {
      setWorkspacePickerError(true);
      showToast('Please select a workspace');
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateTaskRequest = {
        task: title,
        description: description || '',
        priority,
        progress: 'not_started',
        folder_id: task.folder_id ?? null,
        owner_id: userId || '',
        workspace_id: workspaceId,
        project_id: projectId ?? null,
        user_ids: [],
      };

      const created = await tasksHook.createTask(payload);

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

  // ── render ──
  const showWorkspacePicker = isNew && workspaces !== null && workspaces.length !== 1;

  return (
    <div className="task-view-container min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full px-4 sm:px-6 md:px-16 pt-12 sm:pt-14 md:pt-16 pb-16">
        <div className="max-w-5xl mx-auto">

          <div className="mb-4">
            <BreadcrumbBack
              label={sessionStorage.getItem('prevRouteLabel') || 'Dashboard'}
              to={sessionStorage.getItem('prevRoutePath') || '/dashboard'}
            />
          </div>

          {/* Icon picker (edit mode only) */}
          {!isNew && (
            <div className="mb-2">
              <IconPicker
                value={icon}
                size={36}
                onChange={(v) => {
                  setIcon(v);
                  if (taskIdParam && taskIdParam !== 'new') {
                    taskService.updateTaskIcon(taskIdParam as string, v).catch(() => {});
                  }
                }}
              />
            </div>
          )}

          {/* Workspace picker row (new task, multiple workspaces) */}
          {showWorkspacePicker && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm w-28 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                Workspace
              </span>
              <WorkspacePicker
                workspaces={workspaces!}
                selectedId={workspaceId}
                onChange={(id) => { setWorkspaceId(id); setWorkspacePickerError(false); }}
                error={workspacePickerError}
              />
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && isNew) { e.preventDefault(); handleCreate(); } }}
            placeholder="Untitled"
            className="w-full text-5xl font-bold placeholder-gray-300 dark:placeholder-dark-text-muted bg-transparent border-none outline-none mb-6"
            style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          />

          {/* Description editor */}
          <div className="mt-6">
            <Suspense
              fallback={
                <div className="min-h-[240px] rounded-xl border border-gray-100 dark:border-dark-border bg-gray-50/40 dark:bg-dark-bg/40 animate-pulse" />
              }
            >
              <MarkdownEditor
                key={taskIdParam || 'new'}
                value={description ?? ''}
                onChange={setDescription}
                containerClassName="task-editor"
              />
            </Suspense>
          </div>

          {/* Create button (new tasks only) */}
          {isNew && (
            <div className="mt-10 flex items-center gap-3">
              <button
                onClick={handleCreate}
                disabled={isCreating || !title.trim()}
                className="px-6 py-2.5 rounded-full font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
              >
                {isCreating ? 'Creating…' : 'Create Task'}
              </button>
              {workspacePickerError && !workspaceId && (
                <span className="text-sm text-red-500">Select a workspace first</span>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .task-editor {
          color: inherit;
          font-size: 1rem;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
};

export default TaskView;
