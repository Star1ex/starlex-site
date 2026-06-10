import type { TaskPriority, TaskStatus } from '@/types/dto.js';

export const TASK_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'canceled',
] as const satisfies readonly TaskStatus[];

export const TASK_PRIORITIES = [
  'urgent',
  'high',
  'medium',
  'low',
  'none',
] as const satisfies readonly TaskPriority[];

export type TaskStatusTone = 'neutral' | 'progress' | 'review' | 'success' | 'muted';

export type TaskStatusMeta = {
  label: string;
  shortLabel: string;
  columnTitle: string;
  tone: TaskStatusTone;
  dot: string;
  dotClass: string;
  pillClass: string;
};

export type TaskPriorityMeta = {
  label: string;
  color: string;
  rank: number;
};

export const TASK_STATUS_META: Record<TaskStatus, TaskStatusMeta> = {
  backlog: {
    label: 'Backlog',
    shortLabel: 'Backlog',
    columnTitle: 'Backlog',
    tone: 'muted',
    dot: 'var(--status-backlog-text)',
    dotClass: 'bg-[color:var(--status-backlog-text)]',
    pillClass: 'bg-[color:var(--status-backlog-bg)] text-[color:var(--status-backlog-text)]',
  },
  todo: {
    label: 'To Do',
    shortLabel: 'To Do',
    columnTitle: 'To Do',
    tone: 'neutral',
    dot: 'var(--status-todo-text)',
    dotClass: 'bg-[color:var(--status-todo-text)]',
    pillClass: 'bg-[color:var(--status-todo-bg)] text-[color:var(--status-todo-text)]',
  },
  in_progress: {
    label: 'In Progress',
    shortLabel: 'In Progress',
    columnTitle: 'In Progress',
    tone: 'progress',
    dot: 'var(--status-progress-text)',
    dotClass: 'bg-[color:var(--status-progress-text)]',
    pillClass: 'bg-[color:var(--status-progress-bg)] text-[color:var(--status-progress-text)]',
  },
  in_review: {
    label: 'In Review',
    shortLabel: 'Review',
    columnTitle: 'In Review',
    tone: 'review',
    dot: 'var(--status-review-text)',
    dotClass: 'bg-[color:var(--status-review-text)]',
    pillClass: 'bg-[color:var(--status-review-bg)] text-[color:var(--status-review-text)]',
  },
  done: {
    label: 'Done',
    shortLabel: 'Done',
    columnTitle: 'Done',
    tone: 'success',
    dot: 'var(--status-done-text)',
    dotClass: 'bg-[color:var(--status-done-text)]',
    pillClass: 'bg-[color:var(--status-done-bg)] text-[color:var(--status-done-text)]',
  },
  canceled: {
    label: 'Canceled',
    shortLabel: 'Canceled',
    columnTitle: 'Canceled',
    tone: 'muted',
    dot: 'var(--status-canceled-text)',
    dotClass: 'bg-[color:var(--status-canceled-text)]',
    pillClass: 'bg-[color:var(--status-canceled-bg)] text-[color:var(--status-canceled-text)]',
  },
};

export const TASK_PRIORITY_META: Record<TaskPriority, TaskPriorityMeta> = {
  urgent: { label: 'Urgent', color: 'var(--priority-urgent-text)', rank: 4 },
  high: { label: 'High', color: 'var(--priority-high-text)', rank: 3 },
  medium: { label: 'Medium', color: 'var(--priority-medium-text)', rank: 2 },
  low: { label: 'Low', color: 'var(--priority-low-text)', rank: 1 },
  none: { label: 'None', color: 'var(--priority-none-text)', rank: 0 },
};

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function normalizeTaskStatus(value: string | null | undefined): TaskStatus {
  return value && isTaskStatus(value) ? value : 'backlog';
}

export function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.includes(value as TaskPriority);
}

export function normalizeTaskPriority(value: string | null | undefined): TaskPriority {
  return value && isTaskPriority(value) ? value : 'none';
}
