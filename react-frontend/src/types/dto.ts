// ==================== FOLDER DTOs ====================
export interface FolderDTO {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
  team_id: string | null;
  owner_id: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderRequest {
  name: string;
  color?: string;
  icon?: string;
  parent_id?: string | null;
  team_id?: string | null;
  owner_id: string;
  position?: number;
}

export interface FolderMoveRequest {
  folder_id: string;
  parent_id: string;
}

// ==================== TASK DTOs ====================
export interface TaskDTO {
  id: string;
  task: string;
  description: string;
  user_ids: UserDTO[]; // expanded to include user objects for frontend
  team_id: string | null;
  folder_id: string | null;
  owner_id: string;
  priority: 'low' | 'medium' | 'high';
  progress: 'not_started' | 'in_progress' | 'done';
  created_at: string;
}

export interface CreateTaskRequest {
  user_ids?: string[];
  task: string;
  description?: string;
  progress?: 'not_started' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  folder_id?: string | null;
  team_id?: string | null;
  owner_id: string;
}

export interface UpdateTaskRequest {
  task?: string;
  description?: string;
  user_ids?: string[];
  priority?: 'low' | 'medium' | 'high';
  folder_id?: string | null;
  owner_id?: string;
}

export type TaskProgress = 'not_started' | 'in_progress' | 'done';

export interface UpdateProgressRequest {
  progress: TaskProgress;
}

// ==================== TEAM DTOs ====================
export interface TeamDTO {
  id: string;
  name: string;
  description: string;
  emails?: string[];
}

export interface CreateTeamRequest {
  user_id: string;
  name: string;
  description: string;
  emails?: string[];
}

export interface AddUserToTeamRequest {
  email: string;
}

export interface RemoveUserFromTeamRequest {
  userId: string;
}

// ==================== USER DTOs ====================
export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  photo_url: string | null;
  avatar_url?: string | null;
  auth_providers?: string[];
  google_id?: string | null;
  github_id?: string | null;
  email_verified?: boolean;
}

export interface UserProfileDTO {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  photo_url: string | null;
  avatar_url?: string | null;
  auth_providers?: string[];
  google_id?: string | null;
  github_id?: string | null;
  email_verified?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  photo_url?: string | null;
}

// ==================== AUTH DTOs ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token: string; // backward compatibility
  user: UserDTO;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface VerifyEmailRequest {
  user_id: string;
  code: string;
}

export interface ResendCodeRequest {
  user_id: string;
}

export interface AuthResponse {
  message: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface PasswordChangeResponse {
  message: string;
  access_token: string;
  token?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetVerifyRequest {
  email?: string;
  token?: string;
  code?: string;
}

export interface PasswordResetConfirmRequest {
  email?: string;
  token?: string;
  code?: string;
  new_password: string;
}
