import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { taskService } from '@/services/api/index.js';
import type { TaskDTO, TaskQueryParams, TaskStatus } from '@/types/dto.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { useAuth } from '@/contexts/useAuth.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { useTaskRealtime } from '@/shared/hooks/useRealtimeSync.js';
import { showToast } from '@/shared/lib/toast.js';
import { getAllViews, type SavedView } from '@/shared/lib/savedViews.js';
import { pageVariants, listItemVariants, listVariants } from '@/shared/lib/animations.js';
import { StatusMenu } from '@/features/taskStatus/StatusMenu.js';
import { can } from '@/shared/lib/permissions.js';
import { TASK_PRIORITY_META } from '@/entities/task/model/taskMeta.js';

// ─── task row ──────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  canEditStatus,
  onNavigate,
  onDelete,
  onStatusChange,
}: {
  task: TaskDTO;
  canEditStatus: boolean;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDone = task.progress === 'done' || task.status === 'done';
  const priorityMeta = task.priority !== 'none' ? TASK_PRIORITY_META[task.priority] : null;

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  return (
    <motion.div
      variants={listItemVariants}
      className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-[color:var(--sx-surface-hover)] transition-colors"
      onClick={() => onNavigate(task.id)}
    >
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
        <StatusMenu
          taskId={task.id}
          status={task.status}
          canEdit={canEditStatus}
          onStatusChange={(status) => onStatusChange(task.id, status)}
        />
      </div>

      {task.key && (
        <span className="label-caps text-[color:var(--sx-text-subtle)] font-mono flex-shrink-0 w-16 truncate">{task.key}</span>
      )}

      <span className={`flex-1 text-body-md min-w-0 truncate ${isDone ? 'line-through text-[color:var(--sx-text-subtle)]' : 'text-[color:var(--sx-text)]'}`}>
        {task.task}
      </span>

      {priorityMeta && (
        <span className="sx-chip my-issue-priority-chip" style={{ color: priorityMeta.color }}>
          <span className="sx-dot" />
          <span>{priorityMeta.label}</span>
        </span>
      )}

      {task.due_date && (
        <span className="text-label-sm text-[color:var(--sx-text-subtle)] flex-shrink-0 font-mono">
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="w-6 h-6 flex items-center justify-center rounded text-[color:var(--sx-text-disabled)] opacity-0 group-hover:opacity-100 hover:text-[color:var(--sx-text)] transition-all"
        >
          <MoreHorizontal size={13} />
        </button>
        {menuOpen && (
          <div className="dropdown-menu absolute right-0 top-7 z-20 min-w-[130px]">
            <button onClick={() => { onNavigate(task.id); setMenuOpen(false); }}
              className="dropdown-menu-item">
              <ChevronRight size={13} /> Open
            </button>
            <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
              className="dropdown-menu-item dropdown-menu-item--danger">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── view tabs ─────────────────────────────────────────────────────────────────

function ViewTabs({ views, activeId, onChange }: { views: SavedView[]; activeId: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-[color:var(--sx-line)] hide-scrollbar">
      {views.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={`relative flex-shrink-0 px-3 pb-2.5 pt-1 text-label-sm font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors ${
            activeId === v.id
              ? 'text-[color:var(--sx-text)] after:bg-[color:var(--sx-accent)]'
              : 'text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] after:bg-transparent'
          }`}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export const MyIssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const { userId } = useAuth();

  useDocumentTitle('My Issues');

  const views = useMemo(() => getAllViews(), []);
  const activeViewId = searchParams.get('view') ?? views[0]?.id ?? 'my-open';
  const activeView = useMemo(
    () => views.find(v => v.id === activeViewId) ?? views[0],
    [activeViewId, views],
  );

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const load = useCallback(async (params: TaskQueryParams, append = false) => {
    if (!activeWorkspaceId) return;
    setLoading(true);
    try {
      const queryParams: TaskQueryParams = {
        ...params,
        assignee_id: userId ?? undefined,
        limit: 50,
      };
      const result = await taskService.queryTasks(activeWorkspaceId, queryParams);
      setTasks(prev => append ? [...prev, ...result.tasks] : result.tasks);
      setNextCursor(result.next_cursor);
    } catch {
      showToast('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, userId]);

  useEffect(() => {
    if (activeView) load(activeView.params);
  }, [activeView, load]);

  const handleDeleteTask = useCallback(async (id: string) => {
    const snapshot = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await taskService.deleteTask(id);
    } catch {
      setTasks(snapshot);
      showToast('Failed to delete task');
    }
  }, [tasks]);

  const handleStatusChange = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, status } : task));
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || !activeView) return;
    load({ ...activeView.params, cursor: nextCursor }, true);
  }, [nextCursor, activeView, load]);

  // Live sync: refetch the current view when any task changes.
  useTaskRealtime(useCallback(() => {
    if (activeView) load(activeView.params);
  }, [activeView, load]));

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-body-md text-[color:var(--sx-text-subtle)]">Select a workspace to view issues</p>
      </div>
    );
  }

  return (
    <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="mb-6">
        <h1 className="text-headline-lg font-hanken font-bold text-[color:var(--sx-text)] mb-1">My Issues</h1>
        <p className="text-body-md text-[color:var(--sx-text-subtle)]">Tasks assigned to you in this workspace</p>
      </div>

      <ViewTabs
        views={views}
        activeId={activeViewId}
        onChange={id => setSearchParams({ view: id })}
      />

      <div className="mt-4">
        {loading && tasks.length === 0 ? (
          <div className="space-y-2">
            {[0,1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-[color:var(--sx-surface)] animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 size={32} className="text-[color:var(--sx-text-disabled)] mb-3" />
            <p className="text-body-md text-[color:var(--sx-text-subtle)] font-medium">All clear!</p>
            <p className="text-label-sm text-[color:var(--sx-text-disabled)] mt-1">No tasks match this view</p>
          </div>
        ) : (
          <div>
            <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-0.5">
              {tasks.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  canEditStatus={can.editTask(activeWorkspace?.role)}
                  onNavigate={id => navigate(`/task/${id}`)}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </motion.div>
            {nextCursor && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full mt-4 py-3 liquid-button !justify-center text-label-sm text-[color:var(--sx-text-muted)] disabled:opacity-40"
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
