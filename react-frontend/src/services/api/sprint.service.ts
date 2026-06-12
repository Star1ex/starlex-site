import { httpClient } from './client.js';
import type {
  SprintDTO,
  CreateSprintRequest,
  UpdateSprintRequest,
  CompleteSprintRequest,
  SubtaskDTO,
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
} from '../../types/dto.js';

export const sprintService = {
  async getWorkspaceSprints(workspaceId: string, options?: { signal?: AbortSignal }): Promise<SprintDTO[]> {
    const response = await httpClient.get<SprintDTO[]>(`/api/workspaces/${workspaceId}/sprints`, {
      signal: options?.signal as AbortSignal | undefined,
    });
    return response.data;
  },

  async getSprintById(workspaceId: string, sprintId: string, options?: { signal?: AbortSignal }): Promise<SprintDTO> {
    const response = await httpClient.get<SprintDTO>(`/api/workspaces/${workspaceId}/sprints/${sprintId}`, {
      signal: options?.signal as AbortSignal | undefined,
    });
    return response.data;
  },

  async createSprint(workspaceId: string, data: CreateSprintRequest): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/workspaces/${workspaceId}/sprints`, data);
    return response.data;
  },

  async updateSprint(workspaceId: string, sprintId: string, data: UpdateSprintRequest): Promise<SprintDTO> {
    const response = await httpClient.patch<SprintDTO>(`/api/workspaces/${workspaceId}/sprints/${sprintId}`, data);
    return response.data;
  },

  async startSprint(workspaceId: string, sprintId: string): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/workspaces/${workspaceId}/sprints/${sprintId}/start`);
    return response.data;
  },

  async completeSprint(workspaceId: string, sprintId: string, data?: CompleteSprintRequest): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/workspaces/${workspaceId}/sprints/${sprintId}/complete`, data ?? {});
    return response.data;
  },

  async archiveSprint(workspaceId: string, sprintId: string): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/workspaces/${workspaceId}/sprints/${sprintId}/archive`);
    return response.data;
  },

  async deleteSprint(workspaceId: string, sprintId: string): Promise<void> {
    await httpClient.delete(`/api/workspaces/${workspaceId}/sprints/${sprintId}`);
  },

  async moveTaskToSprint(taskId: string, sprintId: string | null): Promise<void> {
    await httpClient.patch(`/api/tasks/${taskId}/sprint`, { sprint_id: sprintId });
  },

  async updateTaskPosition(taskId: string, position: number): Promise<void> {
    await httpClient.patch(`/api/tasks/${taskId}/position`, { position });
  },

  async createSubtask(taskId: string, data: CreateSubtaskRequest): Promise<SubtaskDTO> {
    const response = await httpClient.post<SubtaskDTO>(`/api/tasks/${taskId}/subtasks`, data);
    return response.data;
  },

  async updateSubtask(taskId: string, subtaskId: string, data: UpdateSubtaskRequest): Promise<SubtaskDTO> {
    const response = await httpClient.patch<SubtaskDTO>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, data);
    return response.data;
  },

  async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    await httpClient.delete(`/api/tasks/${taskId}/subtasks/${subtaskId}`);
  },
};
