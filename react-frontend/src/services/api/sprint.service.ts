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
  async getTeamSprints(teamId: string, options?: { signal?: AbortSignal }): Promise<SprintDTO[]> {
    const response = await httpClient.get<SprintDTO[]>(`/api/teams/${teamId}/sprints`, {
      signal: options?.signal as AbortSignal | undefined,
    });
    return response.data;
  },

  async getSprintById(teamId: string, sprintId: string, options?: { signal?: AbortSignal }): Promise<SprintDTO> {
    const response = await httpClient.get<SprintDTO>(`/api/teams/${teamId}/sprints/${sprintId}`, {
      signal: options?.signal as AbortSignal | undefined,
    });
    return response.data;
  },

  async createSprint(teamId: string, data: CreateSprintRequest): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/teams/${teamId}/sprints`, data);
    return response.data;
  },

  async updateSprint(teamId: string, sprintId: string, data: UpdateSprintRequest): Promise<SprintDTO> {
    const response = await httpClient.patch<SprintDTO>(`/api/teams/${teamId}/sprints/${sprintId}`, data);
    return response.data;
  },

  async startSprint(teamId: string, sprintId: string): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/teams/${teamId}/sprints/${sprintId}/start`);
    return response.data;
  },

  async completeSprint(teamId: string, sprintId: string, data?: CompleteSprintRequest): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/teams/${teamId}/sprints/${sprintId}/complete`, data ?? {});
    return response.data;
  },

  async archiveSprint(teamId: string, sprintId: string): Promise<SprintDTO> {
    const response = await httpClient.post<SprintDTO>(`/api/teams/${teamId}/sprints/${sprintId}/archive`);
    return response.data;
  },

  async deleteSprint(teamId: string, sprintId: string): Promise<void> {
    await httpClient.delete(`/api/teams/${teamId}/sprints/${sprintId}`);
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
