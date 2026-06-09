import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Loader2, Plus, Trash2, User, X } from 'lucide-react';
import { taskService, workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { can } from '@/shared/lib/permissions.js';
import { showToast } from '@/shared/lib/toast.js';
import { StatusMenu } from '@/features/taskStatus/StatusMenu.js';
import RichEditor from '@/features/markdown/RichEditor.js';
import { LabelPicker } from '@/shared/ui/LabelPicker.js';
import type { TaskDTO, TaskStatus, TaskPriority, WorkspaceMemberDTO, TaskLabelDTO } from '@/types/dto.js';

const PRIORITY_OPTS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent',  color: '#f87171' },
  { value: 'high',   label: 'High',    color: '#fb923c' },
  { value: 'medium', label: 'Medium',  color: '#a78bfa' },
  { value: 'low',    label: 'Low',     color: '#60a5fa' },
  { value: 'none',   label: 'None',    color: '#475569' },
];

function initials(firstName: string, lastName: string) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
}

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const role = activeWorkspace?.role;
  const workspaceId = activeWorkspace?.id ?? null;

  const [task, setTask] = useState<TaskDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNew = taskId === 'new' || !taskId;
  const canEdit = can.editTask(role);
  const canDelete = task ? can.deleteTask(role, task.owner_id === activeWorkspace?.id) : false;

  useEffect(() => {
    if (!workspaceId) return;
    const ac = new AbortController();
    workspaceService.listMembers(workspaceId)
      .then((m) => { if (!ac.signal.aborted) setMembers(m); })
      .catch(() => {});
    return () => ac.abort();
  }, [workspaceId]);

  useEffect(() => {
    if (isNew) { setLoading(false); return; }
    if (!taskId) return;
    const ac = new AbortController();
    setLoading(true);
    taskService.getTaskById(taskId)
      .then((t) => { if (!ac.signal.aborted) setTask(t); })
      .catch(() => { if (!ac.signal.aborted) showToast('Failed to load task'); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [taskId, isNew]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!task) return;
    const title = e.target.value;
    setTask((prev) => prev ? { ...prev, task: title } : prev);
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      try { await taskService.updateTaskTitle(task.id, title); } catch { showToast('Failed to save title'); }
    }, 600);
  }, [task]);

  const handleDescriptionChange = useCallback(async (value: string) => {
    if (!task) return;
    setTask((prev) => prev ? { ...prev, description: value } : prev);
    try { await taskService.updateTaskDescription(task.id, value); } catch { /* auto-save, silent */ }
  }, [task]);

  const handleStatusChange = useCallback((next: TaskStatus) => {
    setTask((prev) => prev ? { ...prev, status: next } : prev);
  }, []);

  const handlePriorityChange = useCallback(async (priority: TaskPriority) => {
    if (!task) return;
    const prev = task.priority;
    setTask((t) => t ? { ...t, priority } : t);
    try { await taskService.updateTaskPriority(task.id, priority); }
    catch { setTask((t) => t ? { ...t, priority: prev } : t); showToast('Failed to update priority'); }
  }, [task]);

  const handleAssigneeToggle = useCallback(async (userId: string) => {
    if (!task) return;
    const current = (task.assignees ?? []).map((a) => a.id);
    const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
    const prevAssignees = task.assignees;
    const nextAssignees = members.filter((m) => next.includes(m.user.id)).map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      photo_url: m.user.photo_url,
    }));
    setTask((t) => t ? { ...t, assignees: nextAssignees } : t);
    try { await taskService.setTaskAssignees(task.id, next); }
    catch { setTask((t) => t ? { ...t, assignees: prevAssignees } : t); showToast('Failed to update assignees'); }
  }, [task, members]);

  const handleLabelsChange = useCallback(async (nextLabels: TaskLabelDTO[]) => {
    if (!task) return;
    const prevLabels = task.labels;
    setTask((t) => t ? { ...t, labels: nextLabels } : t);
    try { await taskService.setTaskLabels(task.id, nextLabels.map((l) => l.id)); }
    catch { setTask((t) => t ? { ...t, labels: prevLabels } : t); showToast('Failed to update labels'); }
  }, [task]);

  const handleDueDateChange = useCallback(async (date: string | null) => {
    if (!task) return;
    const prev = task.due_date;
    setTask((t) => t ? { ...t, due_date: date } : t);
    try { await taskService.setTaskDueDate(task.id, date); }
    catch { setTask((t) => t ? { ...t, due_date: prev } : t); showToast('Failed to update due date'); }
  }, [task]);

  const handleCreate = useCallback(async () => {
    if (!workspaceId || !task?.task.trim()) { showToast('Task title is required'); return; }
    setSaving(true);
    try {
      const created = await taskService.createWorkspaceTask(workspaceId, {
        task: task.task,
        description: task.description,
        status: task.status,
        priority: task.priority,
        workspace_id: workspaceId,
      });
      navigate(`/task/${created.id}`, { replace: true });
    } catch { showToast('Failed to create task'); }
    finally { setSaving(false); }
  }, [workspaceId, task, navigate]);

  const handleDelete = useCallback(async () => {
    if (!task) return;
    try {
      await taskService.deleteTask(task.id);
      navigate(-1);
    } catch { showToast('Failed to delete task'); }
  }, [task, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  const draft = isNew ? (task ?? {
    id: '',
    task: '',
    description: '',
    status: 'backlog' as TaskStatus,
    priority: 'medium' as TaskPriority,
    progress: 'not_started' as const,
    user_ids: [],
    workspace_id: workspaceId,
    project_id: null,
    owner_id: '',
    subtasks: [],
    created_at: '',
    updated_at: '',
    assignees: [],
    labels: [],
  } satisfies TaskDTO) : task;

  if (!draft) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-white/40">Task not found</p>
      <button onClick={() => navigate(-1)} className="text-label-sm text-white/50 hover:text-white/80">Go back</button>
    </div>
  );

  const assigneeIds = (draft.assignees ?? []).map((a) => a.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 mb-6 text-label-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back
      </button>

      {/* Header: title + key */}
      <div className="glass-card p-6 rounded-2xl mb-4">
        <div className="flex items-start gap-3 mb-4">
          {draft.key && (
            <span className="font-mono text-[11px] text-white/30 tabular-nums mt-1 flex-shrink-0">{draft.key}</span>
          )}
          <textarea
            ref={titleRef}
            value={draft.task}
            onChange={isNew ? (e) => setTask((t) => t ? { ...t, task: e.target.value } : { ...draft, task: e.target.value }) : handleTitleChange}
            disabled={!canEdit && !isNew}
            rows={2}
            placeholder="Task title"
            className="flex-1 bg-transparent resize-none text-headline-md font-hanken font-semibold text-white placeholder-white/20 focus:outline-none leading-snug"
          />
          {canDelete && !isNew && (
            <button onClick={handleDelete} className="flex-shrink-0 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3">
          <StatusMenu
            taskId={draft.id}
            status={draft.status}
            canEdit={canEdit || isNew}
            onStatusChange={isNew ? (s) => setTask((t) => t ? { ...t, status: s } : { ...draft, status: s }) : handleStatusChange}
          />

          {/* Priority */}
          <div className="relative group">
            <button className={`flex items-center gap-1.5 text-label-sm px-2.5 py-1 rounded-full font-medium transition-colors ${canEdit || isNew ? 'hover:bg-white/8 cursor-pointer' : 'cursor-default'}`}>
              {(() => {
                const pc = PRIORITY_OPTS.find((p) => p.value === draft.priority) ?? PRIORITY_OPTS[4];
                return <span style={{ color: pc.color }}>{pc.label}</span>;
              })()}
            </button>
            {(canEdit || isNew) && (
              <div className="absolute left-0 top-full mt-1 glass-card border-white/10 bg-black/80 backdrop-blur-2xl rounded-xl p-1 min-w-[130px] z-50 hidden group-hover:block">
                {PRIORITY_OPTS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => isNew
                      ? setTask((t) => t ? { ...t, priority: p.value } : { ...draft, priority: p.value })
                      : handlePriorityChange(p.value)
                    }
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-label-sm hover:bg-white/8 transition-colors text-left"
                    style={{ color: p.color }}
                  >
                    {p.label}
                    {p.value === draft.priority && (
                      <svg className="ml-auto w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due date */}
          <label className={`flex items-center gap-1.5 text-label-sm text-white/50 rounded-full px-2.5 py-1 ${canEdit || isNew ? 'hover:bg-white/8 cursor-pointer' : 'cursor-default'}`}>
            <CalendarDays size={12} />
            {draft.due_date
              ? new Date(draft.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'No due date'
            }
            {(canEdit || isNew) && (
              <input
                type="date"
                className="sr-only"
                value={draft.due_date ? draft.due_date.slice(0, 10) : ''}
                onChange={(e) => {
                  const val = e.target.value ? `${e.target.value}T00:00:00Z` : null;
                  if (isNew) setTask((t) => t ? { ...t, due_date: val } : { ...draft, due_date: val });
                  else handleDueDateChange(val);
                }}
              />
            )}
          </label>
        </div>
      </div>

      {/* Sidebar-style meta: assignees + labels */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 mb-4">
        {/* Assignees */}
        <div className="glass-card p-4 rounded-2xl">
          <p className="label-caps text-white/30 mb-2 flex items-center gap-1"><User size={10} /> Assignees</p>
          <div className="flex flex-wrap gap-2">
            {(draft.assignees ?? []).map((a) => {
              const src = a.photo_url ?? a.avatar_url ?? undefined;
              const ini = initials(a.firstName, a.lastName);
              return (
                <div key={a.id} className="flex items-center gap-1.5 bg-white/5 rounded-full px-2 py-1">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden">
                    {src ? <img src={src} alt={ini} className="w-full h-full object-cover" /> : ini}
                  </div>
                  <span className="text-[10px] text-white/60">{a.firstName}</span>
                  {(canEdit || isNew) && (
                    <button onClick={() => handleAssigneeToggle(a.id)} className="text-white/30 hover:text-white/60">
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })}
            {(canEdit || isNew) && members.filter((m) => !assigneeIds.includes(m.user.id)).length > 0 && (
              <div className="relative group">
                <button className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 bg-white/5 hover:bg-white/8 rounded-full px-2 py-1 transition-colors">
                  <Plus size={10} /> Add
                </button>
                <div className="absolute left-0 top-full mt-1 glass-card border-white/10 bg-black/80 backdrop-blur-2xl rounded-xl p-1 min-w-[180px] z-50 hidden group-hover:block max-h-48 overflow-y-auto">
                  {members.filter((m) => !assigneeIds.includes(m.user.id)).map((m) => {
                    const src = m.user.photo_url ?? m.user.avatar_url ?? undefined;
                    const ini = initials(m.user.firstName, m.user.lastName);
                    return (
                      <button
                        key={m.user.id}
                        onClick={() => handleAssigneeToggle(m.user.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/8 transition-colors text-left"
                      >
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden flex-shrink-0">
                          {src ? <img src={src} alt={ini} className="w-full h-full object-cover" /> : ini}
                        </div>
                        <span className="text-label-sm text-white/70">{m.user.firstName} {m.user.lastName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {assigneeIds.length === 0 && !canEdit && !isNew && (
              <span className="text-label-sm text-white/30">No assignees</span>
            )}
          </div>
        </div>

        {/* Labels */}
        <div className="glass-card p-4 rounded-2xl">
          <p className="label-caps text-white/30 mb-2">Labels</p>
          {(canEdit || isNew) ? (
            <LabelPicker
              workspaceId={workspaceId ?? ''}
              selected={(draft.labels ?? []) as TaskLabelDTO[]}
              onChange={(nextLabels) => {
                if (isNew) setTask((t) => t ? { ...t, labels: nextLabels } : { ...draft, labels: nextLabels });
                else handleLabelsChange(nextLabels);
              }}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(draft.labels ?? []).map((l) => (
                <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${l.color}22`, color: l.color, border: `1px solid ${l.color}44` }}>
                  {l.name}
                </span>
              ))}
              {(draft.labels ?? []).length === 0 && <span className="text-label-sm text-white/30">No labels</span>}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="glass-card p-6 rounded-2xl mb-4">
        <p className="label-caps text-white/30 mb-3">Description</p>
        {(canEdit || isNew) ? (
          <RichEditor
            value={draft.description}
            onChange={isNew ? (v: string) => setTask((t) => t ? { ...t, description: v } : { ...draft, description: v }) : handleDescriptionChange}
            placeholder="Add a description..."
          />
        ) : (
          <div className="text-body-md text-white/70 leading-relaxed whitespace-pre-wrap">
            {draft.description || <span className="text-white/30">No description</span>}
          </div>
        )}
      </div>

      {/* Subtasks */}
      {!isNew && (draft.subtasks ?? []).length > 0 && (
        <div className="glass-card p-6 rounded-2xl mb-4">
          <p className="label-caps text-white/30 mb-3">Subtasks</p>
          <div className="flex flex-col gap-2">
            {draft.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${sub.is_done ? 'bg-emerald-500/30 border-emerald-500/50' : 'border-white/20'}`}>
                  {sub.is_done && <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`text-body-sm ${sub.is_done ? 'line-through text-white/30' : 'text-white/70'}`}>{sub.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create button */}
      {isNew && (
        <div className="flex justify-end gap-3">
          <button onClick={() => navigate(-1)} className="px-4 py-2 text-label-sm text-white/50 hover:text-white/80 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !draft.task.trim()}
            className="liquid-button px-5 py-2 text-label-sm disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </div>
      )}
    </div>
  );
};
