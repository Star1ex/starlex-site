import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { taskService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { CreateTaskRequest, TaskDTO, TaskPriority } from '@/types/dto.js';

const REMOVE_ANIMATION_MS = 220;

export const useTasks = () => {
  const [tasksById, setTasksById] = useState<Record<string, TaskDTO>>({});
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentTaskIds, setRecentTaskIds] = useState<Record<string, boolean>>({});
  const [removingTaskIds, setRemovingTaskIds] = useState<Record<string, boolean>>({});
  const refreshControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const tasksByIdRef = useRef(tasksById);
  const taskIdsRef = useRef(taskIds);

  useEffect(() => { tasksByIdRef.current = tasksById; }, [tasksById]);
  useEffect(() => { taskIdsRef.current = taskIds; }, [taskIds]);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (refreshControllerRef.current) refreshControllerRef.current.abort();
      refreshControllerRef.current = new AbortController();
      // Workspace tasks are loaded per-workspace via queryTasks; this hook
      // keeps the sidebar task list empty until a workspace is selected.
      setTasksById({});
      setTaskIds([]);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name === 'CanceledError' || e?.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) window.clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = window.setTimeout(() => refreshTasks(), 150);
  }, [refreshTasks]);

  useEffect(() => {
    refreshTasks();
    const onCreated = () => debouncedRefresh();
    window.addEventListener('personalTaskCreated', onCreated);
    return () => {
      window.removeEventListener('personalTaskCreated', onCreated);
      if (refreshTimeoutRef.current) window.clearTimeout(refreshTimeoutRef.current);
      if (refreshControllerRef.current) refreshControllerRef.current.abort();
    };
  }, [refreshTasks, debouncedRefresh]);

  const createTask = useCallback(async (data: CreateTaskRequest) => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticTask: TaskDTO = {
      id: tempId,
      task: data.task || 'New Task',
      description: data.description || '',
      user_ids: [],
      workspace_id: data.workspace_id ?? null,
      project_id: data.project_id ?? null,
      owner_id: data.owner_id || '',
      priority: (data.priority || 'medium') as TaskPriority,
      progress: data.progress || 'not_started',
      status: data.status || 'backlog',
      subtasks: [],
      created_at: now,
      updated_at: now,
    };

    setTasksById((prev) => ({ ...prev, [tempId]: optimisticTask }));
    setTaskIds((prev) => (prev.includes(tempId) ? prev : [...prev, tempId]));

    try {
      const workspaceId = data.workspace_id;
      if (!workspaceId) throw new Error('workspace_id is required to create a task');
      const created = await taskService.createWorkspaceTask(workspaceId, data);
      if (!created?.id) {
        await refreshTasks();
        setTasksById((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
        setTaskIds((prev) => prev.filter((id) => id !== tempId));
        return created;
      }
      setTasksById((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[created.id] = created;
        return next;
      });
      setTaskIds((prev) => prev.map((id) => (id === tempId ? created.id : id)));
      setRecentTaskIds((prev) => ({ ...prev, [created.id]: true }));
      window.setTimeout(() => {
        setRecentTaskIds((prev) => {
          if (!prev[created.id]) return prev;
          const next = { ...prev }; delete next[created.id]; return next;
        });
      }, 180);
      return created;
    } catch (err) {
      setTasksById((prev) => { const next = { ...prev }; delete next[tempId]; return next; });
      setTaskIds((prev) => prev.filter((id) => id !== tempId));
      showToast('Failed to create task. Please try again.');
      throw err;
    }
  }, [refreshTasks]);

  const updateTask = useCallback(async (id: string, data: Partial<CreateTaskRequest>) => {
    const previous = tasksByIdRef.current[id];
    setTasksById((prev) => ({ ...prev, [id]: { ...prev[id], ...data } as TaskDTO }));
    try {
      const updates: Promise<void>[] = [];
      if (data.task !== undefined) updates.push(taskService.updateTaskTitle(id, data.task));
      if (data.description !== undefined) updates.push(taskService.updateTaskDescription(id, data.description || ''));
      if (data.priority !== undefined) updates.push(taskService.updateTaskPriority(id, data.priority));
      if (data.user_ids !== undefined) updates.push(taskService.updateTaskAssignees(id, data.user_ids));
      if (updates.length > 0) await Promise.all(updates);
    } catch (err) {
      if (previous) setTasksById((prev) => ({ ...prev, [id]: previous }));
      else await refreshTasks();
      showToast('Failed to save task changes.');
      throw err;
    }
  }, [refreshTasks]);

  const deleteTask = useCallback(async (id: string) => {
    const snapshotById = tasksByIdRef.current;
    const snapshotIds = taskIdsRef.current;
    setRemovingTaskIds((prev) => ({ ...prev, [id]: true }));
    await new Promise((resolve) => window.setTimeout(resolve, REMOVE_ANIMATION_MS));
    setTasksById((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setTaskIds((prev) => prev.filter((taskId) => taskId !== id));
    try {
      await taskService.deleteTask(id);
    } catch (err) {
      setTasksById(snapshotById);
      setTaskIds(snapshotIds);
      setRemovingTaskIds((prev) => { const next = { ...prev }; delete next[id]; return next; });
      showToast('Failed to delete task.');
      throw err;
    } finally {
      setRemovingTaskIds((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }
  }, []);

  const tasks = useMemo(() => taskIds.map((id) => tasksById[id]).filter(Boolean), [taskIds, tasksById]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    removingTaskIds,
    recentTaskIds,
    refreshTasks,
  } as const;
};
