import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { taskService, workspaceService } from '@/services/api/index.js';
import { getLastWorkspaceId, useWorkspace } from '@/contexts/useWorkspace.js';
import { useAuth } from '@/contexts/useAuth.js';
import { can } from '@/shared/lib/permissions.js';
import { showToast } from '@/shared/lib/toast.js';
import { TaskDetailMain } from './detail/TaskDetailMain.js';
import { TaskDetailNav } from './detail/TaskDetailNav.js';
import { TaskPropertiesPanel } from './detail/TaskPropertiesPanel.js';
import { emptyTask } from './detail/taskDetailUtils.js';
import type { TaskDTO, TaskStatus, TaskPriority, WorkspaceMemberDTO, TaskLabelDTO } from '@/types/dto.js';

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
      const created = await taskService.createTask(workspaceId, {
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
        <Loader2 className="w-6 h-6 text-[color:var(--sx-text-subtle)] animate-spin" />
      </div>
    );
  }

  if (!draft) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-[color:var(--sx-text-subtle)]">Task not found</p>
      <button onClick={() => navigate(-1)} className="text-label-sm text-[color:var(--sx-text-muted)] hover:text-[color:var(--sx-text)]">Go back</button>
    </div>
  );

  return (
    <div className="task-detail-page">
      <TaskDetailNav
        canDelete={canDelete && !isNew}
        onBack={() => navigate(-1)}
        onDelete={handleDelete}
      />

      <div className="task-detail-layout">
        <TaskDetailMain
          draft={draft}
          workspaceName={activeWorkspace?.name || 'Workspace'}
          titleRef={titleRef}
          editable={editable}
          isNew={isNew}
          saving={saving}
          workspaceId={workspaceId}
          onTitleChange={handleTitleChange}
          onDescriptionChange={handleDescriptionChange}
          onCreate={handleCreate}
          onCancel={() => navigate(-1)}
        />

        <TaskPropertiesPanel
          task={draft}
          workspaceId={workspaceId}
          members={members}
          editable={editable}
          isNew={isNew}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onDueDateChange={handleDueDateChange}
          onAssigneeToggle={handleAssigneeToggle}
          onLabelsChange={handleLabelsChange}
        />
      </div>
    </div>
  );
};
