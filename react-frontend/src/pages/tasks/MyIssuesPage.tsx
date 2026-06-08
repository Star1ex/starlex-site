import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { taskService } from '@/services/api/index.js';
import type { TaskDTO, TaskQueryParams } from '@/types/dto.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { showToast } from '@/shared/lib/toast.js';
import { getAllViews, type SavedView } from '@/shared/lib/savedViews.js';
import { pageVariants, listItemVariants, listVariants } from '@/shared/lib/animations.js';

const PRIORITY_CLS: Record<string, string> = {
  high:   'text-orange-400',
  medium: 'text-amber-400',
  low:    'text-blue-400',
};

// ─── task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onNavigate, onDelete }: { task: TaskDTO; onNavigate: (id: string) => void; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDone = task.progress === 'done' || task.status === 'done';
  const isInProgress = task.progress === 'in_progress' || task.status === 'in_progress';

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
      className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-white/4 transition-all"
      onClick={() => onNavigate(task.id)}
    >
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
        {isDone ? (
          <CheckCircle2 size={16} className="text-green-400" />
        ) : isInProgress ? (
          <Clock size={16} className="text-blue-400" />
        ) : (
          <Circle size={16} className="text-white/20" />
        )}
      </div>

      {task.key && (
        <span className="label-caps text-white/30 font-mono flex-shrink-0 w-16 truncate">{task.key}</span>
      )}

      <span className={`flex-1 text-body-md min-w-0 truncate ${isDone ? 'line-through text-white/30' : 'text-white/80'}`}>
        {task.task}
      </span>

      {task.priority && PRIORITY_CLS[task.priority] && (
        <span className={`text-label-sm font-medium flex-shrink-0 ${PRIORITY_CLS[task.priority]}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      )}

      {task.due_date && (
        <span className="text-label-sm text-white/30 flex-shrink-0 font-mono">
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}

      <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="w-6 h-6 flex items-center justify-center rounded text-white/25 opacity-0 group-hover:opacity-100 hover:text-white/70 transition-all"
        >
          <MoreHorizontal size={13} />
        </button>
        {menuOpen && (
          <div className="dropdown-menu absolute right-0 top-7 z-20 min-w-[130px]">
            <button onClick={() => { onNavigate(task.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-white/70 hover:bg-white/5 transition-colors rounded-lg">
              <ChevronRight size={13} /> Open
            </button>
            <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-red-400 hover:bg-red-900/20 transition-colors rounded-lg">
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
    <div className="flex items-center gap-1 overflow-x-auto pb-1 hide-scrollbar">
      {views.map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-label-sm font-medium transition-all ${
            activeId === v.id
              ? 'bg-white/8 text-white/90'
              : 'text-white/40 hover:text-white/70 hover:bg-white/4'
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
  const { activeWorkspaceId } = useWorkspace();
  const { userId } = useAuth();

  useDocumentTitle('My Issues');

  const views = getAllViews();
  const activeViewId = searchParams.get('view') ?? views[0]?.id ?? 'my-open';
  const activeView = views.find(v => v.id === activeViewId) ?? views[0];

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

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || !activeView) return;
    load({ ...activeView.params, cursor: nextCursor }, true);
  }, [nextCursor, activeView, load]);

  if (!activeWorkspaceId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-body-md text-white/30">Select a workspace to view issues</p>
      </div>
    );
  }

  return (
    <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="mb-6">
        <h1 className="text-headline-lg font-hanken font-bold text-white mb-1">My Issues</h1>
        <p className="text-body-md text-white/40">Tasks assigned to you in this workspace</p>
      </div>

      <ViewTabs
        views={views}
        activeId={activeViewId}
        onChange={id => setSearchParams({ view: id })}
      />

      <div className="mt-4">
        {loading && tasks.length === 0 ? (
          <div className="space-y-2">
            {[0,1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-white/4 animate-pulse" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 size={32} className="text-white/15 mb-3" />
            <p className="text-body-md text-white/40 font-medium">All clear!</p>
            <p className="text-label-sm text-white/25 mt-1">No tasks match this view</p>
          </div>
        ) : (
          <div>
            <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-0.5">
              {tasks.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onNavigate={id => navigate(`/task/${id}`)}
                  onDelete={handleDeleteTask}
                />
              ))}
            </motion.div>
            {nextCursor && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full mt-4 py-3 liquid-button !justify-center text-label-sm text-white/40 disabled:opacity-40"
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
