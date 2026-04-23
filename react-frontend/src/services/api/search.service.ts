import { httpClient } from './client.js';
import { UserDTO } from '../../types/dto.js';

export interface SearchTeamResult { id: string; name: string; }
export interface SearchSprintResult { id: string; name: string; team_id: string; status: string; }
export interface SearchTaskResult { id: string; task: string; team_id: string; sprint_id: string | null; progress: string; priority: string; }
export interface GlobalSearchResponse {
  teams: SearchTeamResult[];
  sprints: SearchSprintResult[];
  tasks: SearchTaskResult[];
}

export const searchService = {
  async searchUsers(email: string): Promise<UserDTO[]> {
    const response = await httpClient.get<UserDTO[]>(`/api/search/${encodeURIComponent(email)}`);
    return response.data;
  },

  async globalSearch(query: string, signal?: AbortSignal): Promise<GlobalSearchResponse> {
    const response = await httpClient.get<GlobalSearchResponse>(
      `/api/search?q=${encodeURIComponent(query)}`,
      { signal }
    );
    return response.data;
  },
};