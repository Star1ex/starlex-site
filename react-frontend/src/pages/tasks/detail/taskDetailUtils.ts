import type { TaskDTO } from '@/types/dto.js';

export function emptyTask(workspaceId: string | null): TaskDTO {
  return {
    id: '',
    task: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    progress: 'not_started',
    user_ids: [],
    workspace_id: workspaceId,
    project_id: null,
    owner_id: '',
    subtasks: [],
    created_at: '',
    updated_at: '',
    assignees: [],
    labels: [],
  };
}
