import { httpClient } from './client.js';
import { FolderDTO, CreateFolderRequest } from '@/types/dto.js';

export const folderService = {
  async getUserFolders(): Promise<FolderDTO[]> {
    const response = await httpClient.get<FolderDTO[]>('/api/folders');
    return response.data;
  },

  async getTeamFolders(teamId: string): Promise<FolderDTO[]> {
    const response = await httpClient.get<FolderDTO[]>(`/api/folders/team/${teamId}`);
    return response.data;
  },

  async getFolderById(id: string): Promise<FolderDTO> {
    const response = await httpClient.get<FolderDTO>(`/api/folders/${id}`);
    return response.data;
  },

  async getSubfolders(parentId: string): Promise<FolderDTO[]> {
    const response = await httpClient.get<FolderDTO[]>(`/api/folders/${parentId}/children`);
    return response.data;
  },

  async createFolder(data: CreateFolderRequest): Promise<string> {
    const response = await httpClient.post<string>('/api/folders', data);
    return response.data;
  },

  async updateFolder(id: string, data: Partial<FolderDTO>): Promise<string> {
    const response = await httpClient.put<string>(`/api/folders/${id}`, data);
    return response.data;
  },

  async deleteFolder(id: string): Promise<string> {
    const response = await httpClient.delete<string>(`/api/folders/${id}`);
    return response.data;
  },

  async moveFolder(folderId: string, parentId: string | null): Promise<string> {
    const response = await httpClient.put<string>(`/api/folders/${folderId}/move`, {
      folder_id: folderId,
      parent_id: parentId,
    });
    return response.data;
  },
};
