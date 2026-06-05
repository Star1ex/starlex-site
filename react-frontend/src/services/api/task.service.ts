import type { AxiosError } from 'axios';
import { httpClient } from './client.js';
import { TaskDTO, CreateTaskRequest, UpdateTaskRequest, TaskProgress } from '../../types/dto.js';
import { showToast } from '@/shared/lib/toast.js';

const maybeHandleStaleUpdate = (error: unknown) => {
  const err = error as AxiosError;
  if (err?.response?.status === 409) {
    showToast('Someone else edited this task. Refresh to see latest.');
  }
};

export const taskService = {
  // ---- single task (any task the user can access) ----
  async getTasksByFolder(folderId: string): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(
      `/api/tasks/folder/${folderId}?folder_id=${folderId}`
    );
    return response.data;
  },

  async getTaskById(id: string): Promise<TaskDTO> {
    const response = await httpClient.get<TaskDTO>(`/api/tasks/${id}`);
    return response.data;
  },

  async updateTask(id: string, data: UpdateTaskRequest, options?: { signal?: AbortSignal }): Promise<TaskDTO> {
    try {
      const response = await httpClient.put<TaskDTO>(`/api/tasks/${id}`, data, { signal: options?.signal as any });
      return response.data;
    } catch (error) {
      maybeHandleStaleUpdate(error);
      throw error;
    }
  },

  async updateTaskIcon(id: string, icon: string): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/icon`, { icon });
  },

  async updateTaskTitle(id: string, task: string, options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/title`, { task }, { signal: options?.signal as any });
  },

  async updateTaskDescription(id: string, description: string, options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/description`, { description }, { signal: options?.signal as any });
  },

  async updateTaskPriority(id: string, priority: 'low' | 'medium' | 'high', options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/priority`, { priority }, { signal: options?.signal as any });
  },

  async updateTaskStatus(id: string, progress: TaskProgress, options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/progress`, { progress }, { signal: options?.signal as any });
  },

  async updateTaskAssignees(id: string, userIds: string[], options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/assignees`, { user_ids: userIds }, { signal: options?.signal as any });
  },

  async deleteTask(id: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/tasks/${id}`);
    return response.data;
  },

  async moveTaskToFolder(taskId: string, folderId: string | null): Promise<string> {
    const params = new URLSearchParams();
    if (folderId) params.append('folder_id', folderId);

    const response = await httpClient.put<string>(
      `/api/tasks/${taskId}/move${folderId ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  // ---- workspace-scoped ----
  // Any workspace member may create tasks; owner is taken from the auth token.
  async getWorkspaceTasks(workspaceId: string, options?: { signal?: AbortSignal }): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(`/api/workspaces/${workspaceId}/tasks`, {
      signal: options?.signal as any,
    });
    return response.data;
  },

  async getUserTasksInWorkspace(workspaceId: string, userId: string): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(
      `/api/workspaces/${workspaceId}/tasks/user/${userId}`
    );
    return response.data;
  },

  async createWorkspaceTask(workspaceId: string, data: CreateTaskRequest): Promise<TaskDTO> {
    const response = await httpClient.post<TaskDTO>(`/api/workspaces/${workspaceId}/tasks`, data);
    return response.data;
  },

  async updateWorkspaceTask(workspaceId: string, taskId: string, data: UpdateTaskRequest): Promise<TaskDTO> {
    try {
      const response = await httpClient.put<TaskDTO>(`/api/workspaces/${workspaceId}/tasks/${taskId}`, data);
      return response.data;
    } catch (error) {
      maybeHandleStaleUpdate(error);
      throw error;
    }
  },

  async updateWorkspaceTaskTitle(workspaceId: string, taskId: string, task: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/title`, { task });
  },

  async updateWorkspaceTaskDescription(workspaceId: string, taskId: string, description: string): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/description`, { description });
  },

  async updateWorkspaceTaskPriority(workspaceId: string, taskId: string, priority: 'low' | 'medium' | 'high'): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/priority`, { priority });
  },

  async updateWorkspaceTaskStatus(workspaceId: string, taskId: string, progress: TaskProgress): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/progress`, { progress });
  },

  async updateWorkspaceTaskAssignees(workspaceId: string, taskId: string, userIds: string[]): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/assignees`, { user_ids: userIds });
  },

  async deleteWorkspaceTask(workspaceId: string, taskId: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/workspaces/${workspaceId}/tasks/${taskId}`);
    return response.data;
  },
};
