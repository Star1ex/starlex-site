import { httpClient } from './client.js';
import { UserDTO } from '../../types/dto.js';

export const searchService = {
  async searchUsers(email: string): Promise<UserDTO[]> {
    const response = await httpClient.get<UserDTO[]>(`/api/search/${encodeURIComponent(email)}`);
    return response.data;
  },
};