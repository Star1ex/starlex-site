import { httpClient } from './client.js';
import {
  ProjectDTO,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateTaskRequest,
  TaskDTO,
  UserDTO,
} from '../../types/dto.js';

export const projectService = {
  // ---- workspace-scoped ----
  async getWorkspaceProjects(
    workspaceId: string,
    options?: { signal?: AbortSignal }
  ): Promise<ProjectDTO[]> {
    const response = await httpClient.get<ProjectDTO[]>(
      `/api/workspaces/${workspaceId}/projects`,
      { signal: options?.signal as AbortSignal | undefined }
    );
    return response.data;
  },

  async createProject(workspaceId: string, data: CreateProjectRequest): Promise<ProjectDTO> {
    const response = await httpClient.post<ProjectDTO>(
      `/api/workspaces/${workspaceId}/projects`,
      data
    );
    return response.data;
  },

  // ---- project-scoped ----
  async getProjectById(projectId: string, options?: { signal?: AbortSignal }): Promise<ProjectDTO> {
    const response = await httpClient.get<ProjectDTO>(`/api/projects/${projectId}`, {
      signal: options?.signal as AbortSignal | undefined,
    });
    return response.data;
  },

  async updateProject(projectId: string, data: UpdateProjectRequest): Promise<ProjectDTO> {
    const response = await httpClient.patch<ProjectDTO>(`/api/projects/${projectId}`, data);
    return response.data;
  },

  async setProjectStatus(projectId: string, status: ProjectDTO['status']): Promise<ProjectDTO> {
    const response = await httpClient.patch<ProjectDTO>(`/api/projects/${projectId}`, { status });
    return response.data;
  },

  async setProjectPriority(projectId: string, priority: ProjectDTO['priority']): Promise<ProjectDTO> {
    const response = await httpClient.patch<ProjectDTO>(`/api/projects/${projectId}`, { priority });
    return response.data;
  },

  async deleteProject(projectId: string): Promise<void> {
    await httpClient.delete(`/api/projects/${projectId}`);
  },

  // ---- members ----
  async getProjectMembers(projectId: string): Promise<UserDTO[]> {
    const response = await httpClient.get<UserDTO[]>(`/api/projects/${projectId}/members`);
    return response.data;
  },

  async addProjectMember(projectId: string, email: string): Promise<{ message: string }> {
    const response = await httpClient.post<{ message: string }>(
      `/api/projects/${projectId}/members`,
      { email }
    );
    return response.data;
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await httpClient.delete(`/api/projects/${projectId}/members`, {
      data: { user_id: userId },
    });
  },

  // ---- tasks ----
  async getProjectTasks(projectId: string, options?: { signal?: AbortSignal }): Promise<TaskDTO[]> {
    const response = await httpClient.get<TaskDTO[]>(`/api/projects/${projectId}/tasks`, {
      signal: options?.signal as AbortSignal | undefined,
    });
    return response.data;
  },

  async createProjectTask(projectId: string, data: CreateTaskRequest): Promise<TaskDTO> {
    const response = await httpClient.post<TaskDTO>(`/api/projects/${projectId}/tasks`, data);
    return response.data;
  },
};
