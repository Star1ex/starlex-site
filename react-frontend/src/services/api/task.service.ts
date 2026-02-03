import { httpClient } from './client.js';
import { TaskDTO, CreateTaskRequest, UpdateTaskRequest, TaskProgress } from '../../types/dto.js';

export const taskService = {
  // Personal
  async getPersonalTasks(): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>('/api/tasks');
    return response.data;
  },

  async getPersonalTasksWithoutFolder(): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>('/api/tasks/without-folder');
    return response.data;
  },

  async getTasksByFolder(folderId: string): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(`/api/tasks/folder/${folderId}?folder_id=${folderId}`);
    return response.data;
  },

  async createPersonalTask(data: CreateTaskRequest): Promise<TaskDTO> {
    const response = await httpClient.post<TaskDTO>('/api/tasks', data);
    return response.data;
  },

  async getTaskById(id: string): Promise<TaskDTO> {
    const response = await httpClient.get<TaskDTO>(`/api/tasks/${id}`);
    return response.data;
  },

  async updateTask(id: string, data: UpdateTaskRequest, options?: { signal?: AbortSignal }): Promise<TaskDTO> {
    const response = await httpClient.put<TaskDTO>(`/api/tasks/${id}`, data, { signal: options?.signal as any });
    return response.data;
  },

  async updateTaskProgress(id: string, progress: TaskProgress, options?: { signal?: AbortSignal }): Promise<TaskDTO> {
    const response = await httpClient.put<TaskDTO>(`/api/tasks/${id}/progress`, { progress }, { signal: options?.signal as any });
    return response.data;
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

  // Team
  async getTeamTasks(teamId: string): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(`/api/teams/${teamId}/tasks`);
    return response.data;
  },

  async getUserTasksInTeam(teamId: string, userId: string): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(`/api/teams/${teamId}/tasks/user/${userId}`);
    return response.data;
  },

  async createTeamTask(teamId: string, data: CreateTaskRequest): Promise<TaskDTO> {
    const response = await httpClient.post<TaskDTO>(`/api/teams/${teamId}/tasks`, data);
    return response.data;
  },

  async updateTeamTask(teamId: string, taskId: string, data: UpdateTaskRequest): Promise<TaskDTO> {
    const response = await httpClient.put<TaskDTO>(`/api/teams/${teamId}/tasks/${taskId}`, data);
    return response.data;
  },

  async updateTeamTaskProgress(teamId: string, taskId: string, progress: TaskProgress): Promise<TaskDTO> {
    const response = await httpClient.put<TaskDTO>(`/api/teams/${teamId}/tasks/${taskId}/progress`, {
      progress,
    });
    return response.data;
  },

  async deleteTeamTask(teamId: string, taskId: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/teams/${teamId}/tasks/${taskId}`);
    return response.data;
  },
};
