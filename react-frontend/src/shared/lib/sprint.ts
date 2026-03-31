import type { SprintStatus } from '@/types/dto.js';

export const SPRINT_STATUS_LABEL: Record<SprintStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

export const SPRINT_STATUS_COLOR: Record<SprintStatus, string> = {
  active: '#22c55e',
  completed: '#3b82f6',
  archived: '#6b7280',
  planning: '#f59e0b',
};
