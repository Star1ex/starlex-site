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
  }, [refreshTasks]);

  const createTask = useCallback(async (data: CreateTaskRequest) => {
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

    const created = await taskService.createPersonalTask(payload);
    await refreshTasks();
    window.dispatchEvent(new CustomEvent('personalTaskCreated'));
    return created;
  }, [refreshTasks]);

  const updateTask = useCallback(async (id: string, data: Partial<CreateTaskRequest>) => {
    const updated = await taskService.updateTask(id, data as any);
    await refreshTasks();
    return updated;
  }, [refreshTasks]);

  const deleteTask = useCallback(async (id: string) => {
    await taskService.deleteTask(id);
    await refreshTasks();
    window.dispatchEvent(new CustomEvent('personalTaskCreated'));
  }, [refreshTasks]);

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
