import type { AxiosError } from 'axios';
import { httpClient } from './client.js';
import type {
  TaskDTO, CreateTaskRequest, UpdateTaskRequest,
  TaskStatus, TaskPriority, TaskQueryParams, TaskQueryResponse, TaskCategoriesResponse,
} from '../../types/dto.js';
import { showToast } from '@/shared/lib/toast.js';

const maybeHandleStaleUpdate = (error: unknown) => {
  const err = error as AxiosError;
  if (err?.response?.status === 409) {
    showToast('Someone else edited this task. Refresh to see latest.');
  }
};

export const taskService = {
  async getTaskById(id: string): Promise<TaskDTO> {
    const response = await httpClient.get<TaskDTO>(`/api/tasks/${id}`);
    return response.data;
  },

  async updateTask(id: string, data: UpdateTaskRequest, options?: { signal?: AbortSignal }): Promise<TaskDTO> {
    try {
      const response = await httpClient.put<TaskDTO>(`/api/tasks/${id}`, data, { signal: options?.signal });
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
    await httpClient.patch(`/api/tasks/${id}/title`, { task }, { signal: options?.signal });
  },

  async updateTaskDescription(id: string, description: string, options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/description`, { description }, { signal: options?.signal });
  },

  async updateTaskPriority(id: string, priority: TaskPriority, options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/priority`, { priority }, { signal: options?.signal });
  },

  /** Canonical status setter — hits PATCH /api/tasks/:id/status with the enum value. */
  async setTaskStatus(id: string, status: TaskStatus, options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/status`, { status }, { signal: options?.signal });
  },

  /** Position/order within column (for board reorder). */
  async setTaskPosition(id: string, data: { position: number; status?: TaskStatus }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/position`, data);
  },

  async setTaskAssignees(id: string, userIds: string[]): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/assignees`, { user_ids: userIds });
  },

  async setTaskLabels(id: string, labelIds: string[]): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/labels`, { label_ids: labelIds });
  },

  async setTaskDueDate(id: string, dueDate: string | null): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/due-date`, { due_date: dueDate });
  },

  async updateTaskAssignees(id: string, userIds: string[], options?: { signal?: AbortSignal }): Promise<void> {
    await httpClient.patch(`/api/tasks/${id}/assignees`, { user_ids: userIds }, { signal: options?.signal });
  },

  async deleteTask(id: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/tasks/${id}`);
    return response.data;
  },

  // ---- workspace-scoped ----
  async getWorkspaceTasks(workspaceId: string, options?: { signal?: AbortSignal }): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(`/api/workspaces/${workspaceId}/tasks`, {
      signal: options?.signal,
    });
    return response.data;
  },

  async createTask(workspaceId: string, data: CreateTaskRequest): Promise<TaskDTO> {
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

  async deleteWorkspaceTask(workspaceId: string, taskId: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/workspaces/${workspaceId}/tasks/${taskId}`);
    return response.data;
  },

  // ---- query / categories ----
  async queryTasks(workspaceId: string, params: TaskQueryParams = {}): Promise<TaskQueryResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const qs = query.toString();
    const response = await httpClient.get<TaskQueryResponse>(
      `/api/workspaces/${workspaceId}/tasks/query${qs ? `?${qs}` : ''}`,
    );
    return response.data;
  },

  async getTaskCategories(workspaceId: string, params: Partial<TaskQueryParams> = {}): Promise<TaskCategoriesResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const qs = query.toString();
    const response = await httpClient.get<TaskCategoriesResponse>(
      `/api/workspaces/${workspaceId}/tasks/categories${qs ? `?${qs}` : ''}`,
    );
    return response.data;
  },

  // workspace-scoped label/assignee patches (kept for backward compat)
  async patchTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    await httpClient.patch(`/api/tasks/${taskId}/status`, { status });
  },

  async patchTaskLabels(workspaceId: string, taskId: string, labelIds: string[]): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/labels`, { label_ids: labelIds });
  },

  async patchTaskDueDate(workspaceId: string, taskId: string, dueDate: string | null): Promise<void> {
    await httpClient.patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/due-date`, { due_date: dueDate });
  },
};
