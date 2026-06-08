// ==================== FOLDER DTOs ====================
export interface FolderDTO {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
  workspace_id: string | null;
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
  workspace_id?: string | null;
  owner_id: string;
  position?: number;
}

export interface FolderMoveRequest {
  folder_id: string;
  parent_id: string;
}

// ==================== TASK DTOs ====================
export type TaskProgress = 'not_started' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskDTO {
  id: string;
  task: string;
  description: string;
  icon?: string;
  user_ids: string[];
  workspace_id: string | null;
  folder_id: string | null;
  project_id: string | null;
  owner_id: string;
  priority: TaskPriority;
  progress: TaskProgress;
  subtasks: SubtaskDTO[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  user_ids?: string[];
  task: string;
  description?: string;
  progress?: TaskProgress;
  priority?: TaskPriority;
  folder_id?: string | null;
  workspace_id?: string | null;
  project_id?: string | null;
  owner_id?: string;
}

export interface UpdateTaskRequest {
  task?: string;
  description?: string;
  user_ids?: string[];
  priority?: TaskPriority;
  folder_id?: string | null;
  owner_id?: string;
  updated_at?: string;
}

export interface UpdateProgressRequest {
  progress: TaskProgress;
}

// ==================== WORKSPACE DTOs ====================
export interface WorkspaceDTO {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  role?: 'owner' | 'admin' | 'member' | 'guest';
  member_count?: number;
  project_count?: number;
  created_at?: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface AddUserToWorkspaceRequest {
  email: string;
}

export interface RemoveUserFromWorkspaceRequest {
  userId: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'guest';

export interface WorkspaceMemberDTO {
  user: UserDTO;
  role: WorkspaceRole;
  joined_at: string;
}

export interface WorkspaceInviteDTO {
  id: string;
  workspace_id: string;
  token: string;
  role: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  revoked_at: string | null;
  created_at: string;
}

export interface InvitePreviewDTO {
  workspace: { id: string; name: string; icon: string; color: string } | null;
  valid: boolean;
}

// ==================== PROJECT DTOs ====================
export type ProjectStatus =
  | 'backlog'
  | 'planned'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type ProjectPriority = 'none' | 'urgent' | 'high' | 'medium' | 'low';

export interface ProjectDTO {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  goal: string;
  icon: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  leader_id: string;
  created_by: string;
  deadline: string | null;
  member_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  goal?: string;
  icon?: string;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  leader_id?: string;
  deadline?: string | null;
  member_ids?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  goal?: string;
  icon?: string;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  leader_id?: string;
  deadline?: string | null;
  clear_deadline?: boolean;
}

export interface AddProjectMemberRequest {
  email: string;
}

export interface RemoveProjectMemberRequest {
  user_id: string;
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
  created_at?: string;
  last_login_at?: string | null;
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
  needs_onboarding?: boolean;
}

export interface VerifyResponse {
  access_token: string;
  needs_onboarding: boolean;
  user: UserDTO;
  message?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// Registration no longer creates a user up front; the account is created only
// after the emailed code is confirmed. The response echoes the email to verify.
export interface RegisterResponse {
  message: string;
  email: string;
}

// Verification is keyed by email (no user exists yet at this stage).
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
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

// ==================== SPRINT DTOs ====================
export type SprintStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface SubtaskDTO {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SprintDTO {
  id: string;
  name: string;
  goal: string; // plain text / markdown sprint description
  workspace_id: string;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  tasks?: TaskDTO[];
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CompleteSprintRequest {
  move_target?: string | null;
}

export interface CreateSubtaskRequest {
  title: string;
}

export interface UpdateSubtaskRequest {
  title?: string;
  is_done?: boolean;
  position?: number;
}
