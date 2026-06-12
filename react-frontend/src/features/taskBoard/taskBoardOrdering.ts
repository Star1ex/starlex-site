import {
  normalizeTaskStatus,
  TASK_STATUSES,
  TASK_STATUS_META,
} from '@/entities/task/model/taskMeta.js';
import type { TaskDTO, TaskStatus } from '@/types/dto.js';

export interface TaskBoardColumnConfig {
  id: TaskStatus;
  label: string;
  dotClass: string;
}

export const TASK_BOARD_COLUMNS: TaskBoardColumnConfig[] = TASK_STATUSES.map((status) => ({
  id: status,
  label: TASK_STATUS_META[status].columnTitle,
  dotClass: TASK_STATUS_META[status].dotClass,
}));

export const columnId = (status: TaskStatus) => `column:${status}`;

export const isColumnId = (id: string) => id.startsWith('column:');

export const statusFromColumnId = (id: string) => normalizeTaskStatus(id.replace('column:', ''));

export function groupTasksByStatus(tasks: TaskDTO[]): Map<TaskStatus, TaskDTO[]> {
  const map = new Map<TaskStatus, TaskDTO[]>();
  for (const col of TASK_BOARD_COLUMNS) map.set(col.id, []);
  for (const task of tasks) {
    const status = normalizeTaskStatus(task.status);
    const bucket = map.get(status) ?? map.get('backlog');
    bucket?.push(task);
  }
  return map;
}

export function moveTask(tasks: TaskDTO[], taskId: string, overId: string | null, targetStatus: TaskStatus): TaskDTO[] {
  const active = tasks.find((task) => task.id === taskId);
  if (!active) return tasks;

  const withoutActive = tasks.filter((task) => task.id !== taskId);
  let insertIndex = withoutActive.length;

  if (overId && !isColumnId(overId)) {
    const overIndex = withoutActive.findIndex((task) => task.id === overId);
    if (overIndex >= 0) insertIndex = overIndex;
  } else {
    for (let index = withoutActive.length - 1; index >= 0; index -= 1) {
      if (normalizeTaskStatus(withoutActive[index].status) === targetStatus) {
        insertIndex = index + 1;
        break;
      }
    }
  }

  const next = [...withoutActive];
  next.splice(insertIndex, 0, { ...active, status: targetStatus });
  return next;
}

export function positionInStatus(tasks: TaskDTO[], taskId: string, status: TaskStatus) {
  return Math.max(
    0,
    tasks
      .filter((task) => normalizeTaskStatus(task.status) === status)
      .findIndex((task) => task.id === taskId),
  );
}
