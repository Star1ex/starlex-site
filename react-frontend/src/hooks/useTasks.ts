import { useCallback, useEffect, useMemo, useState } from 'react';
import { taskService } from '@/services/api/index.js';
import type { CreateTaskRequest, TaskDTO } from '@/types/dto.js';

export const useTasks = () => {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await taskService.getPersonalTasks();
      const personal = (data || []).filter((t) => t.team_id == null || t.team_id === '');
      setTasks(personal);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
    const onCreated = () => refreshTasks();
    window.addEventListener('personalTaskCreated', onCreated);
    return () => window.removeEventListener('personalTaskCreated', onCreated);
  }, []);

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

    setTasks((prev) => [...prev, optimisticTask]);

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
      setTasks((prev) => prev.map((t) => (t.id === tempId ? (created as any) : t)));
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
      return created;
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    }
  }, [refreshTasks]);

  const updateTask = useCallback(async (id: string, data: Partial<CreateTaskRequest>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } as TaskDTO : t)));
    try {
      const updated = await taskService.updateTask(id, data as any);
      setTasks((prev) => prev.map((t) => (t.id === id ? (updated as any) : t)));
      return updated;
    } catch (err) {
      await refreshTasks();
      throw err;
    }
  }, [refreshTasks]);

  const deleteTask = useCallback(async (id: string) => {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await taskService.deleteTask(id);
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
    } catch (err) {
      setTasks(snapshot);
      throw err;
    }
  }, [tasks]);

  const getFolderTasks = useCallback((folderId: string) => {
    return tasks.filter((t) => t.folder_id === folderId);
  }, [tasks]);

  const orphanTasks = useMemo(() => tasks.filter((t) => t.folder_id == null), [tasks]);

  return {
    tasks,
    orphanTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    getFolderTasks,
    refreshTasks,
  } as const;
};
