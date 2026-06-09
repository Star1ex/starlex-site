import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Filter, LayoutGrid, List, Plus, Search, X } from 'lucide-react';
import { taskService } from '@/services/api/index.js';
import { can } from '@/shared/lib/permissions.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { StatusMenu, StatusPill } from '@/features/taskStatus/StatusMenu.js';
import type { TaskCategoriesResponse, TaskDTO, TaskQueryParams, TaskStatus } from '@/types/dto.js';

// ─── priority chip ─────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#f87171', high: '#fb923c', medium: '#a78bfa', low: '#60a5fa', none: '#475569',
};

function PriorityChip({ priority }: { priority: string }) {
  const color = PRIORITY_COLOR[priority] ?? '#475569';
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/5" style={{ color }}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// ─── task row ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskDTO;
  canEdit: boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onClick: (id: string) => void;
}

function TaskRow({ task, canEdit, onStatusChange, onClick }: TaskRowProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <div
      onClick={() => onClick(task.id)}
      className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors group"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <StatusMenu
          taskId={task.id}
          status={task.status}
          canEdit={canEdit}
          onStatusChange={(s) => onStatusChange(task.id, s)}
        />
      </div>
      <span className="font-mono text-[10px] text-white/30 tabular-nums w-[72px] flex-shrink-0">
        {task.key ?? '—'}
      </span>
      <span className="flex-1 text-body-sm text-white/80 group-hover:text-white transition-colors truncate">
        {task.task}
      </span>
      <PriorityChip priority={task.priority} />
      {task.labels && task.labels.length > 0 && (
        <div className="hidden sm:flex gap-1">
          {task.labels.slice(0, 2).map((l) => (
            <span
              key={l.id}
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: `${l.color}22`, color: l.color, border: `1px solid ${l.color}44` }}
            >
              {l.name}
            </span>
          ))}
          {task.labels.length > 2 && (
            <span className="text-[9px] text-white/30">+{task.labels.length - 2}</span>
          )}
        </div>
      )}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex" style={{ gap: -4 }}>
          {task.assignees.slice(0, 3).map((a, i) => {
            const src = a.photo_url ?? a.avatar_url ?? undefined;
            const ini = [a.firstName?.[0], a.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
            return (
              <div
                key={a.id}
                className="w-5 h-5 rounded-full border border-black bg-white/10 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden"
                style={{ zIndex: 10 - i, marginLeft: i > 0 ? -4 : 0 }}
              >
                {src ? <img src={src} alt={ini} className="w-full h-full object-cover" /> : ini}
              </div>
            );
          })}
        </div>
      )}
      {task.due_date && (
        <span className={`text-[10px] flex-shrink-0 ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}

// ─── filter rail ───────────────────────────────────────────────────────────────

interface FilterRailProps {
  categories: TaskCategoriesResponse | null;
  params: TaskQueryParams;
  onChange: (update: Partial<TaskQueryParams>) => void;
}

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
  in_review: 'In Review', done: 'Done', canceled: 'Canceled',
};

function FilterRail({ categories, params, onChange }: FilterRailProps) {
  if (!categories) return <div className="w-[260px] flex-shrink-0" />;

  const groups = categories.categories;
  const statusGroup  = groups.find((g) => g.type === 'status');
  const priorityGroup = groups.find((g) => g.type === 'priority');
  const projectGroup  = groups.find((g) => g.type === 'project');
  const assigneeGroup = groups.find((g) => g.type === 'assignee');

  return (
    <div className="w-[260px] flex-shrink-0 flex flex-col gap-4">
      {statusGroup && statusGroup.items.length > 0 && (
        <div className="glass-card p-4 rounded-2xl">
          <p className="label-caps text-white/30 mb-3">Status</p>
          <div className="flex flex-col gap-1">
            {statusGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ status: params.status === item.id ? undefined : item.id, cursor: undefined })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-label-sm transition-colors ${params.status === item.id ? 'bg-white/12 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white/80'}`}
              >
                <span>{STATUS_LABELS[item.id] ?? item.name}</span>
                <span className="text-[10px] tabular-nums">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {priorityGroup && priorityGroup.items.length > 0 && (
        <div className="glass-card p-4 rounded-2xl">
          <p className="label-caps text-white/30 mb-3">Priority</p>
          <div className="flex flex-col gap-1">
            {priorityGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ priority: params.priority === item.id ? undefined : item.id, cursor: undefined })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-label-sm transition-colors ${params.priority === item.id ? 'bg-white/12 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white/80'}`}
                style={{ color: params.priority === item.id ? PRIORITY_COLOR[item.id] ?? undefined : undefined }}
              >
                <span>{item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                <span className="text-[10px] tabular-nums text-white/30">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {projectGroup && projectGroup.items.length > 0 && (
        <div className="glass-card p-4 rounded-2xl">
          <p className="label-caps text-white/30 mb-3">Project</p>
          <div className="flex flex-col gap-1">
            {projectGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ project_id: params.project_id === item.id ? undefined : item.id, cursor: undefined })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-label-sm transition-colors ${params.project_id === item.id ? 'bg-white/12 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white/80'}`}
              >
                <span className="truncate">{item.id === '__none' ? 'No project' : item.name}</span>
                <span className="text-[10px] tabular-nums text-white/30 flex-shrink-0 ml-2">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {assigneeGroup && assigneeGroup.items.length > 0 && (
        <div className="glass-card p-4 rounded-2xl">
          <p className="label-caps text-white/30 mb-3">Assignee</p>
          <div className="flex flex-col gap-1">
            {assigneeGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ assignee_id: params.assignee_id === item.id ? undefined : item.id, cursor: undefined })}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-label-sm transition-colors ${params.assignee_id === item.id ? 'bg-white/12 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white/80'}`}
              >
                <span className="truncate">{item.id === '__none' ? 'Unassigned' : item.name}</span>
                <span className="text-[10px] tabular-nums text-white/30 flex-shrink-0 ml-2">{item.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export const TaskExplorerPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const role = activeWorkspace?.role;
  const canEdit = can.editTask(role);

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [categories, setCategories] = useState<TaskCategoriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRail, setShowRail] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localQ, setLocalQ] = useState(searchParams.get('q') ?? '');

  const params = useMemo<TaskQueryParams>(() => ({
    status:      searchParams.get('status')      ?? undefined,
    priority:    searchParams.get('priority')    ?? undefined,
    project_id:  searchParams.get('project_id')  ?? undefined,
    assignee_id: searchParams.get('assignee_id') ?? undefined,
    label_id:    searchParams.get('label_id')    ?? undefined,
    q:           searchParams.get('q')           ?? undefined,
    sort_by:     (searchParams.get('sort_by') as TaskQueryParams['sort_by']) ?? 'updated_at',
    direction:   (searchParams.get('direction') as TaskQueryParams['direction']) ?? 'desc',
    cursor:      searchParams.get('cursor')      ?? undefined,
  }), [searchParams]);

  const updateParams = useCallback((update: Partial<TaskQueryParams>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(update).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Fetch categories once
  useEffect(() => {
    if (!workspaceId) return;
    taskService.getTaskCategories(workspaceId)
      .then(setCategories)
      .catch(() => {});
  }, [workspaceId]);

  // Fetch tasks on param change
  useEffect(() => {
    if (!workspaceId) return;
    const ac = new AbortController();
    setLoading(true);
    taskService.queryTasks(workspaceId, params)
      .then((res) => {
        if (ac.signal.aborted) return;
        setTasks(res.tasks);
        setNextCursor(res.next_cursor);
      })
      .catch(() => {})
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [workspaceId, params]);

  const handleStatusChange = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  }, []);

  const handleSearch = useCallback((q: string) => {
    setLocalQ(q);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => updateParams({ q: q || undefined, cursor: undefined }), 350);
  }, [updateParams]);

  const activeFilterCount = [params.status, params.priority, params.project_id, params.assignee_id, params.label_id, params.q]
    .filter(Boolean).length;

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <h1 className="text-headline-md font-hanken font-semibold text-white">All Tasks</h1>
        <div className="flex items-center gap-2">
          {can.createTask(role) && (
            <button
              onClick={() => navigate('/task/new')}
              className="liquid-button flex items-center gap-1.5 px-3 py-1.5 text-label-sm"
            >
              <Plus size={13} /> New task
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks…"
            value={localQ}
            onChange={(e) => handleSearch(e.target.value)}
            className="glass-input w-full pl-8 pr-8 py-1.5 text-label-sm rounded-xl"
          />
          {localQ && (
            <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter rail toggle */}
        <button
          onClick={() => setShowRail((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-label-sm transition-colors ${showRail ? 'bg-white/12 text-white' : 'text-white/50 hover:bg-white/8 hover:text-white/70'}`}
        >
          <Filter size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-[var(--accent)] text-white text-[9px] rounded-full px-1.5 py-0.5 font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View toggle */}
        <div className="flex items-center bg-white/5 rounded-xl p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/12 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-white/12 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            <LayoutGrid size={14} />
          </button>
        </div>

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setLocalQ(''); setSearchParams(new URLSearchParams(), { replace: true }); }}
            className="text-label-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-4 px-6 py-4">
        {showRail && (
          <FilterRail categories={categories} params={params} onChange={updateParams} />
        )}

        {/* Task list */}
        <div className="flex-1 overflow-y-auto glass-card rounded-2xl">
          {loading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 border-b border-white/5 flex items-center gap-3 px-4 animate-pulse">
                  <div className="w-16 h-4 bg-white/5 rounded-full" />
                  <div className="flex-1 h-3 bg-white/5 rounded-full" />
                  <div className="w-12 h-4 bg-white/5 rounded-full" />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <p className="text-white/30 text-body-md">No tasks match</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setLocalQ(''); setSearchParams(new URLSearchParams(), { replace: true }); }}
                  className="text-label-sm text-white/40 hover:text-white/70"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5">
                <span className="label-caps text-white/25 w-[90px]">Status</span>
                <span className="label-caps text-white/25 w-[72px]">Key</span>
                <span className="label-caps text-white/25 flex-1">Title</span>
                <span className="label-caps text-white/25">Priority</span>
                <span className="label-caps text-white/25 hidden sm:block">Labels</span>
              </div>
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  canEdit={canEdit}
                  onStatusChange={handleStatusChange}
                  onClick={(id) => navigate(`/task/${id}`)}
                />
              ))}
              {nextCursor && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={() => updateParams({ cursor: nextCursor })}
                    className="text-label-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
