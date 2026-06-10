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
    dot: '#475569',
    dotClass: 'bg-white/30',
    pillClass: 'bg-white/8 text-white/50',
  },
  todo: {
    label: 'To Do',
    shortLabel: 'To Do',
    columnTitle: 'To Do',
    tone: 'neutral',
    dot: '#60a5fa',
    dotClass: 'bg-[#60a5fa]',
    pillClass: 'bg-blue-500/15 text-blue-300',
  },
  in_progress: {
    label: 'In Progress',
    shortLabel: 'In Progress',
    columnTitle: 'In Progress',
    tone: 'progress',
    dot: '#a78bfa',
    dotClass: 'bg-[#a78bfa]',
    pillClass: 'bg-violet-500/15 text-violet-300',
  },
  in_review: {
    label: 'In Review',
    shortLabel: 'Review',
    columnTitle: 'In Review',
    tone: 'review',
    dot: '#fb923c',
    dotClass: 'bg-[#fb923c]',
    pillClass: 'bg-orange-500/15 text-orange-300',
  },
  done: {
    label: 'Done',
    shortLabel: 'Done',
    columnTitle: 'Done',
    tone: 'success',
    dot: '#34d399',
    dotClass: 'bg-[#34d399]',
    pillClass: 'bg-emerald-500/15 text-emerald-300',
  },
  canceled: {
    label: 'Canceled',
    shortLabel: 'Canceled',
    columnTitle: 'Canceled',
    tone: 'muted',
    dot: '#64748b',
    dotClass: 'bg-white/20',
    pillClass: 'bg-white/5 text-white/30',
  },
};

export const TASK_PRIORITY_META: Record<TaskPriority, TaskPriorityMeta> = {
  urgent: { label: 'Urgent', color: '#f87171', rank: 4 },
  high: { label: 'High', color: '#fb923c', rank: 3 },
  medium: { label: 'Medium', color: '#a78bfa', rank: 2 },
  low: { label: 'Low', color: '#60a5fa', rank: 1 },
  none: { label: 'None', color: '#64748b', rank: 0 },
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
