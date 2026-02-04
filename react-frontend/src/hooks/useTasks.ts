import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { taskService } from '@/services/api/index.js';
import type { CreateTaskRequest, TaskDTO } from '@/types/dto.js';

const REMOVE_ANIMATION_MS = 220;

export const useTasks = () => {
  const [tasksById, setTasksById] = useState<Record<string, TaskDTO>>({});
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingTaskIds, setRemovingTaskIds] = useState<Record<string, boolean>>({});
  const refreshControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const tasksByIdRef = useRef(tasksById);
  const taskIdsRef = useRef(taskIds);

  useEffect(() => {
    tasksByIdRef.current = tasksById;
  }, [tasksById]);

  useEffect(() => {
    taskIdsRef.current = taskIds;
  }, [taskIds]);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (refreshControllerRef.current) {
        refreshControllerRef.current.abort();
      }
      const controller = new AbortController();
      refreshControllerRef.current = controller;
      const data = await taskService.getPersonalTasks({ signal: controller.signal });
      const personal = (data || []).filter((t) => t.team_id == null || t.team_id === '');
      const nextById: Record<string, TaskDTO> = {};
      const nextIds: string[] = [];
      for (const task of personal) {
        nextById[task.id] = task;
        nextIds.push(task.id);
      }
      setTasksById(nextById);
      setTaskIds(nextIds);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTasks();
    }, 150);
  }, [refreshTasks]);

  useEffect(() => {
    refreshTasks();
    const onCreated = () => debouncedRefresh();
    window.addEventListener('personalTaskCreated', onCreated);
    const onTitleChange = (event: Event) => {
      const ev = event as CustomEvent;
      const { id, task } = ev.detail || {};
      if (!id || typeof task !== 'string') return;
      setTasksById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], task } as TaskDTO } : prev));
    };
    window.addEventListener('personalTaskTitleChange', onTitleChange as EventListener);
    return () => {
      window.removeEventListener('personalTaskCreated', onCreated);
      window.removeEventListener('personalTaskTitleChange', onTitleChange as EventListener);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      if (refreshControllerRef.current) {
        refreshControllerRef.current.abort();
      }
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
      team_id: data.team_id ?? null,
      folder_id: data.folder_id ?? null,
      owner_id: data.owner_id,
      priority: (data.priority || 'medium') as any,
      progress: (data.progress || 'not_started') as any,
      created_at: now,
    };

    setTasksById((prev) => ({ ...prev, [tempId]: optimisticTask }));
    setTaskIds((prev) => [...prev, tempId]);

    const payload: CreateTaskRequest = {
      task: data.task || 'New Task',
      description: data.description || '',
      priority: data.priority || 'medium',
      progress: data.progress || 'not_started',
      folder_id: data.folder_id ?? null,
      owner_id: data.owner_id,
      team_id: data.team_id ?? null,
      user_ids: data.user_ids ?? [],
    };

    try {
      const created = await taskService.createPersonalTask(payload);
      const real = created as TaskDTO;
      setTasksById((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[real.id] = real;
        return next;
      });
      setTaskIds((prev) => prev.map((id) => (id === tempId ? real.id : id)));
      return created;
    } catch (err) {
      setTasksById((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      setTaskIds((prev) => prev.filter((id) => id !== tempId));
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<CreateTaskRequest>) => {
    setTasksById((prev) => ({ ...prev, [id]: { ...prev[id], ...data } as TaskDTO }));
    try {
      const updated = await taskService.updateTask(id, data as any);
      setTasksById((prev) => ({ ...prev, [id]: updated as TaskDTO }));
      return updated;
    } catch (err) {
      await refreshTasks();
      throw err;
    }
  }, [refreshTasks]);

  const moveTaskToFolder = useCallback(async (id: string, folderId: string | null) => {
    const snapshotById = tasksByIdRef.current;
    const snapshotIds = taskIdsRef.current;
    setTasksById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], folder_id: folderId } as TaskDTO } : prev));
    try {
      await taskService.moveTaskToFolder(id, folderId);
    } catch (err) {
      setTasksById(snapshotById);
      setTaskIds(snapshotIds);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const snapshotById = tasksByIdRef.current;
    const snapshotIds = taskIdsRef.current;
    setRemovingTaskIds((prev) => ({ ...prev, [id]: true }));
    await new Promise((resolve) => window.setTimeout(resolve, REMOVE_ANIMATION_MS));
    setTasksById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTaskIds((prev) => prev.filter((taskId) => taskId !== id));
    try {
      await taskService.deleteTask(id);
    } catch (err) {
      setTasksById(snapshotById);
      setTaskIds(snapshotIds);
      setRemovingTaskIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      throw err;
    } finally {
      setRemovingTaskIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  const getFolderTasks = useCallback((folderId: string) => {
    return taskIds.map((id) => tasksById[id]).filter((t) => t?.folder_id === folderId);
  }, [taskIds, tasksById]);

  const tasks = useMemo(() => taskIds.map((id) => tasksById[id]).filter(Boolean), [taskIds, tasksById]);
  const orphanTasks = useMemo(() => tasks.filter((t) => t.folder_id == null), [tasks]);

  return {
    tasks,
    orphanTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    moveTaskToFolder,
    removingTaskIds,
    getFolderTasks,
    refreshTasks,
  } as const;
};
