// types.ts - Shared TypeScript interfaces
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  photo_url: string | null;
  email?: string;
  avatar_url?: string | null;
  auth_providers?: string[];
  google_id?: string | null;
  github_id?: string | null;
  email_verified?: boolean;
}

export interface TaskUser extends User {
  id: string;
}

export interface Task {
  id: string;
  task: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  progress: 'not_started' | 'in_progress' | 'done';
  user_ids: TaskUser[];
}

export interface TeamData {
  id: string;
  users: User[];
}

export interface CreateTaskFormData {
  task: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  progress: 'not_started' | 'in_progress' | 'done';
  user_ids: string[];
}

export interface SearchUserResult extends User {
  email: string;
}
