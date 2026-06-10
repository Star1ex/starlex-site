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
  backlog: { label: 'Backlog', dot: '#64748b', progress: 0 },
  planned: { label: 'Planned', dot: '#a78bfa', progress: 20 },
  in_progress: { label: 'In Progress', dot: '#38bdf8', progress: 55 },
  paused: { label: 'Paused', dot: '#f59e0b', progress: 35 },
  completed: { label: 'Completed', dot: '#34d399', progress: 100 },
  cancelled: { label: 'Cancelled', dot: '#f87171', progress: 0 },
};

export const PROJECT_PRIORITY_META: Record<ProjectPriority, ProjectPriorityMeta> = {
  none: { label: 'No priority', color: 'var(--priority-none-text)', bars: 0 },
  urgent: { label: 'Urgent', color: '#f87171', bars: 4 },
  high: { label: 'High', color: '#fb923c', bars: 3 },
  medium: { label: 'Medium', color: '#a78bfa', bars: 2 },
  low: { label: 'Low', color: '#60a5fa', bars: 1 },
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
