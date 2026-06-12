import type { ProjectPriority, ProjectStatus } from '@/types/dto.js';

export const PROJECT_STATUSES = [
  'backlog',
  'planned',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
] as const satisfies readonly ProjectStatus[];

export const PROJECT_PRIORITIES = [
  'none',
  'urgent',
  'high',
  'medium',
  'low',
] as const satisfies readonly ProjectPriority[];

export type ProjectStatusMeta = {
  label: string;
  dot: string;
  progress: number;
};

export type ProjectPriorityMeta = {
  label: string;
  color: string;
  bars: number;
};

export const PROJECT_STATUS_META: Record<ProjectStatus, ProjectStatusMeta> = {
  backlog: { label: 'Backlog', dot: 'var(--status-backlog-text)', progress: 0 },
  planned: { label: 'Planned', dot: 'var(--status-progress-text)', progress: 20 },
  in_progress: { label: 'In Progress', dot: 'var(--status-todo-text)', progress: 55 },
  paused: { label: 'Paused', dot: 'var(--status-review-text)', progress: 35 },
  completed: { label: 'Completed', dot: 'var(--status-done-text)', progress: 100 },
  cancelled: { label: 'Cancelled', dot: 'var(--priority-urgent-text)', progress: 0 },
};

export const PROJECT_PRIORITY_META: Record<ProjectPriority, ProjectPriorityMeta> = {
  none: { label: 'No priority', color: 'var(--priority-none-text)', bars: 0 },
  urgent: { label: 'Urgent', color: 'var(--priority-urgent-text)', bars: 4 },
  high: { label: 'High', color: 'var(--priority-high-text)', bars: 3 },
  medium: { label: 'Medium', color: 'var(--priority-medium-text)', bars: 2 },
  low: { label: 'Low', color: 'var(--priority-low-text)', bars: 1 },
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus);
}

export function normalizeProjectStatus(value: string | null | undefined): ProjectStatus {
  return value && isProjectStatus(value) ? value : 'backlog';
}

export function isProjectPriority(value: string): value is ProjectPriority {
  return PROJECT_PRIORITIES.includes(value as ProjectPriority);
}

export function normalizeProjectPriority(value: string | null | undefined): ProjectPriority {
  return value && isProjectPriority(value) ? value : 'none';
}
