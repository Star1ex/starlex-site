import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Flag,
  Loader2,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { taskService, workspaceService } from '@/services/api/index.js';
import { getLastWorkspaceId, useWorkspace } from '@/contexts/WorkspaceContext.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { can } from '@/shared/lib/permissions.js';
import { showToast } from '@/shared/lib/toast.js';
import { StatusMenu } from '@/features/taskStatus/StatusMenu.js';
import RichEditor from '@/features/markdown/RichEditor.js';
import { InlineLabelChips, LabelPicker } from '@/shared/ui/LabelPicker.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskDTO, TaskStatus, TaskPriority, WorkspaceMemberDTO, TaskLabelDTO } from '@/types/dto.js';

type AvatarUser = {
  firstName: string;
  lastName: string;
  photo_url?: string | null;
  avatar_url?: string | null;
};

const PRIORITY_OPTS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent',  color: '#f87171' },
  { value: 'high',   label: 'High',    color: '#fb923c' },
  { value: 'medium', label: 'Medium',  color: '#a78bfa' },
  { value: 'low',    label: 'Low',     color: '#60a5fa' },
  { value: 'none',   label: 'None',    color: '#94a3b8' },
];

function emptyTask(workspaceId: string | null): TaskDTO {
  return {
    id: '',
    task: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    progress: 'not_started',
    user_ids: [],
    workspace_id: workspaceId,
    project_id: null,
    owner_id: '',
    subtasks: [],
    created_at: '',
    updated_at: '',
    assignees: [],
    labels: [],
  };
}

function initials(firstName: string, lastName: string) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
}

function dueDateValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function dueDateLabel(value?: string | null) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function priorityConfig(priority: TaskPriority) {
  return PRIORITY_OPTS.find((p) => p.value === priority) ?? PRIORITY_OPTS[4];
}

function AssigneeAvatar({ member }: { member: AvatarUser }) {
  const src = member.photo_url ?? member.avatar_url ?? undefined;
  const ini = initials(member.firstName, member.lastName);
  return (
    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-semibold text-white overflow-hidden flex-shrink-0">
      {src ? <img src={src} alt={ini} className="w-full h-full object-cover" /> : ini}
    </div>
  );
}

function PropertyBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-white/8 last:border-b-0">
      <p className="label-caps text-white/30 mb-2">{label}</p>
      {children}
    </div>
  );
}

interface PriorityMenuProps {
  priority: TaskPriority;
  canEdit: boolean;
  onChange: (priority: TaskPriority) => void;
}

function PriorityMenu({ priority, canEdit, onChange }: PriorityMenuProps) {
  const selected = priorityConfig(priority);

  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-2 text-label-sm font-medium" style={{ color: selected.color }}>
        <Flag size={13} />
        {selected.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full h-9 flex items-center justify-between rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 px-3 text-label-sm transition-colors"
        >
          <span className="flex items-center gap-2 font-medium" style={{ color: selected.color }}>
            <Flag size={13} />
            {selected.label}
          </span>
          <ChevronDown size={14} className="text-white/35" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="glass-menu min-w-[180px] rounded-xl p-1"
      >
        {PRIORITY_OPTS.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onSelect={() => onChange(p.value)}
            className="glass-menu-item flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/7 focus:bg-white/7"
            style={{ color: p.color }}
          >
            <Flag size={13} />
            <span className="text-label-sm">{p.label}</span>
            {p.value === priority && <Check size={13} className="ml-auto text-white/50" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AssigneeControlProps {
  members: WorkspaceMemberDTO[];
  assignees: NonNullable<TaskDTO['assignees']>;
  canEdit: boolean;
  onToggle: (userId: string) => void;
}

function AssigneeControl({ members, assignees, canEdit, onToggle }: AssigneeControlProps) {
  const selectedIds = assignees.map((a) => a.id);

  return (
    <div className="space-y-2">
      {assignees.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {assignees.map((assignee) => (
            <div key={assignee.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2">
              <AssigneeAvatar member={assignee} />
              <span className="min-w-0 flex-1 truncate text-label-sm text-white/70">
                {assignee.firstName} {assignee.lastName}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onToggle(assignee.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
                  aria-label="Remove assignee"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-label-sm text-white/35">No assignees</p>
      )}

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full h-9 flex items-center justify-between rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 px-3 text-label-sm text-white/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Plus size={13} />
                Assign people
              </span>
              <ChevronDown size={14} className="text-white/35" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="glass-menu min-w-[240px] max-h-72 rounded-xl p-1"
          >
            {members.length === 0 ? (
              <p className="px-3 py-2 text-xs text-white/30">No workspace members loaded.</p>
            ) : (
              members.map((member) => {
                const active = selectedIds.includes(member.user.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={member.user.id}
                    checked={active}
                    onSelect={(event) => {
                      event.preventDefault();
                      onToggle(member.user.id);
                    }}
                    className="glass-menu-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/7 focus:bg-white/7"
                  >
                    <AssigneeAvatar member={member.user} />
                    <span className={`min-w-0 flex-1 truncate text-label-sm ${active ? 'text-white' : 'text-white/65'}`}>
                      {member.user.firstName} {member.user.lastName}
                    </span>
                    {active && <Check size={13} className="text-white/50" />}
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeWorkspace } = useWorkspace();
  const { userId } = useAuth();
  const role = activeWorkspace?.role;
  const workspaceId = searchParams.get('workspaceId') ?? activeWorkspace?.id ?? getLastWorkspaceId();

  const [task, setTask] = useState<TaskDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNew = taskId === 'new' || !taskId;
  const canEdit = can.editTask(role);
  const editable = canEdit || isNew;
  const canDelete = task ? can.deleteTask(role, task.owner_id === userId) : false;
  const draft = isNew ? (task ?? emptyTask(workspaceId)) : task;

  const updateDraft = useCallback((updates: Partial<TaskDTO>) => {
    setTask((prev) => ({ ...emptyTask(workspaceId), ...prev, ...updates }));
  }, [workspaceId]);

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

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 76)}px`;
  }, [draft?.task]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const title = e.target.value;
    if (isNew) {
      updateDraft({ task: title });
      return;
    }
    if (!task) return;
    setTask((prev) => prev ? { ...prev, task: title } : prev);
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      try { await taskService.updateTaskTitle(task.id, title); } catch { showToast('Failed to save title'); }
    }, 600);
  }, [isNew, task, updateDraft]);

  const handleDescriptionChange = useCallback(async (value: string) => {
    if (isNew || !task?.id) {
      updateDraft({ description: value });
      return;
    }
    setTask((prev) => prev ? { ...prev, description: value } : prev);
    try { await taskService.updateTaskDescription(task.id, value); } catch { /* auto-save, silent */ }
  }, [isNew, task, updateDraft]);

  const handleStatusChange = useCallback((next: TaskStatus) => {
    if (isNew || !task?.id) {
      updateDraft({ status: next });
      return;
    }
    setTask((prev) => prev ? { ...prev, status: next } : prev);
  }, [isNew, task, updateDraft]);

  const handlePriorityChange = useCallback(async (priority: TaskPriority) => {
    if (isNew || !task?.id) {
      updateDraft({ priority });
      return;
    }
    const prev = task.priority;
    setTask((t) => t ? { ...t, priority } : t);
    try { await taskService.updateTaskPriority(task.id, priority); }
    catch { setTask((t) => t ? { ...t, priority: prev } : t); showToast('Failed to update priority'); }
  }, [isNew, task, updateDraft]);

  const handleAssigneeToggle = useCallback(async (targetUserId: string) => {
    const current = (task?.assignees ?? []).map((a) => a.id);
    const next = current.includes(targetUserId)
      ? current.filter((id) => id !== targetUserId)
      : [...current, targetUserId];
    const nextAssignees = members.filter((m) => next.includes(m.user.id)).map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      photo_url: m.user.photo_url,
      avatar_url: m.user.avatar_url,
    }));

    if (isNew || !task?.id) {
      updateDraft({ assignees: nextAssignees, user_ids: next });
      return;
    }

    const prevAssignees = task.assignees;
    setTask((t) => t ? { ...t, assignees: nextAssignees } : t);
    try { await taskService.setTaskAssignees(task.id, next); }
    catch { setTask((t) => t ? { ...t, assignees: prevAssignees } : t); showToast('Failed to update assignees'); }
  }, [isNew, task, members, updateDraft]);

  const handleLabelsChange = useCallback(async (nextLabels: TaskLabelDTO[]) => {
    if (isNew || !task?.id) {
      updateDraft({ labels: nextLabels });
      return;
    }
    const prevLabels = task.labels;
    setTask((t) => t ? { ...t, labels: nextLabels } : t);
    try { await taskService.setTaskLabels(task.id, nextLabels.map((l) => l.id)); }
    catch { setTask((t) => t ? { ...t, labels: prevLabels } : t); showToast('Failed to update labels'); }
  }, [isNew, task, updateDraft]);

  const handleDueDateChange = useCallback(async (date: string | null) => {
    if (isNew || !task?.id) {
      updateDraft({ due_date: date });
      return;
    }
    const prev = task.due_date;
    setTask((t) => t ? { ...t, due_date: date } : t);
    try { await taskService.setTaskDueDate(task.id, date); }
    catch { setTask((t) => t ? { ...t, due_date: prev } : t); showToast('Failed to update due date'); }
  }, [isNew, task, updateDraft]);

  const handleCreate = useCallback(async () => {
    if (!workspaceId) { showToast('Select a workspace before creating a task'); return; }
    if (!task?.task.trim()) { showToast('Task title is required'); return; }
    setSaving(true);
    try {
      const created = await taskService.createWorkspaceTask(workspaceId, {
        task: task.task,
        description: task.description,
        status: task.status,
        priority: task.priority,
        user_ids: (task.assignees ?? []).map((a) => a.id),
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

  if (!draft) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-white/40">Task not found</p>
      <button onClick={() => navigate(-1)} className="text-label-sm text-white/50 hover:text-white/80">Go back</button>
    </div>
  );

  const selectedLabels = (draft.labels ?? []) as TaskLabelDTO[];
  const selectedAssignees = draft.assignees ?? [];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-label-sm text-white/40 hover:text-white/75 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {canDelete && !isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-label-sm text-white/35 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-6 items-start">
        <main className="min-w-0 space-y-4">
          <section className="glass-card rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-white/30">
              <span>{draft.key || 'New task'}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{activeWorkspace?.name || 'Workspace'}</span>
            </div>

            <textarea
              ref={titleRef}
              value={draft.task}
              onChange={handleTitleChange}
              disabled={!editable}
              rows={2}
              placeholder="Task title"
              className="block w-full min-h-[76px] resize-none overflow-hidden bg-transparent text-[28px] leading-tight font-hanken font-semibold text-white placeholder-white/20 focus:outline-none disabled:opacity-70"
            />
          </section>

          <section className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-body-md font-medium text-white/75">Description</h2>
                <p className="text-label-sm text-white/30 mt-0.5">Write the task context, checklist, notes, or links.</p>
              </div>
            </div>
            <div className="min-h-[340px] px-6 py-5">
              {editable ? (
                <RichEditor
                  value={draft.description}
                  onChange={handleDescriptionChange}
                  placeholder="Add a description..."
                  containerClassName="min-h-[300px]"
                />
              ) : (
                <div className="text-body-md text-white/70 leading-relaxed whitespace-pre-wrap">
                  {draft.description || <span className="text-white/30">No description</span>}
                </div>
              )}
            </div>
          </section>

          {!isNew && (draft.subtasks ?? []).length > 0 && (
            <section className="glass-card rounded-2xl p-6">
              <h2 className="text-body-md font-medium text-white/75 mb-3">Subtasks</h2>
              <div className="flex flex-col gap-2">
                {draft.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${sub.is_done ? 'bg-emerald-500/30 border-emerald-500/50' : 'border-white/20'}`}>
                      {sub.is_done && <Check size={10} className="text-emerald-300" />}
                    </div>
                    <span className={`text-body-sm ${sub.is_done ? 'line-through text-white/30' : 'text-white/70'}`}>{sub.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {isNew && (
            <div className="flex justify-end gap-3">
              <button onClick={() => navigate(-1)} className="px-4 py-2 text-label-sm text-white/50 hover:text-white/80 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !draft.task.trim() || !workspaceId}
                className="liquid-button px-5 py-2 text-label-sm disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create task'}
              </button>
            </div>
          )}
        </main>

        <aside className="glass-card rounded-2xl p-4 xl:sticky xl:top-28">
          <div className="flex items-center gap-2 pb-3 border-b border-white/8">
            <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center text-white/45">
              <Tag size={15} />
            </div>
            <div>
              <h2 className="text-body-md font-medium text-white/80">Properties</h2>
              <p className="text-label-sm text-white/30">Status, people, labels, date</p>
            </div>
          </div>

          <PropertyBlock label="Status">
            <StatusMenu
              taskId={draft.id}
              status={draft.status}
              canEdit={editable}
              onStatusChange={handleStatusChange}
            />
          </PropertyBlock>

          <PropertyBlock label="Priority">
            <PriorityMenu priority={draft.priority} canEdit={editable} onChange={handlePriorityChange} />
          </PropertyBlock>

          <PropertyBlock label="Due date">
            {editable ? (
              <div className="flex items-center gap-2">
                <label className="relative flex-1">
                  <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDateValue(draft.due_date)}
                    onChange={(e) => handleDueDateChange(e.target.value ? `${e.target.value}T00:00:00Z` : null)}
                    className="w-full h-9 rounded-lg bg-white/5 border border-white/8 pl-9 pr-3 text-label-sm text-white/70 outline-none hover:bg-white/8 focus:border-white/20 [color-scheme:dark]"
                  />
                </label>
                {draft.due_date && (
                  <button
                    type="button"
                    onClick={() => handleDueDateChange(null)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
                    aria-label="Clear due date"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-2 text-label-sm text-white/60">
                <CalendarDays size={13} />
                {dueDateLabel(draft.due_date)}
              </span>
            )}
          </PropertyBlock>

          <PropertyBlock label="Assignees">
            <AssigneeControl
              members={members}
              assignees={selectedAssignees}
              canEdit={editable}
              onToggle={handleAssigneeToggle}
            />
          </PropertyBlock>

          <PropertyBlock label="Labels">
            <div className="space-y-2">
              {selectedLabels.length > 0 ? (
                <InlineLabelChips labels={selectedLabels} maxVisible={8} />
              ) : (
                <p className="text-label-sm text-white/35">No labels</p>
              )}
              {editable && (
                <LabelPicker
                  workspaceId={workspaceId ?? ''}
                  selected={selectedLabels}
                  onChange={handleLabelsChange}
                  label="Edit labels"
                  triggerClassName="w-full h-9 flex items-center justify-between rounded-lg bg-white/5 hover:bg-white/8 border border-white/8 px-3 text-label-sm text-white/60 transition-colors disabled:opacity-40"
                />
              )}
            </div>
          </PropertyBlock>

          {!isNew && (
            <div className="pt-3 text-[11px] text-white/25 leading-relaxed">
              Updated {draft.updated_at ? new Date(draft.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'recently'}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
