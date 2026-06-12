import type {
  TaskDTO,
  TaskQueryParams,
  WorkspaceMemberDTO,
} from '@/types/dto.js';

export function memberToTaskAssignee(member: WorkspaceMemberDTO): NonNullable<TaskDTO['assignees']>[number] {
  return {
    id: member.user.id,
    firstName: member.user.firstName,
    lastName: member.user.lastName,
    photo_url: member.user.photo_url,
    avatar_url: member.user.avatar_url,
  };
}

export function countActiveTaskFilters(params: TaskQueryParams) {
  return [
    params.status,
    params.priority,
    params.project_id,
    params.assignee_id,
    params.label_id,
    params.q,
  ].filter(Boolean).length;
}
