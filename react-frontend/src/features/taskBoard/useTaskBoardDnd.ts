import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { normalizeTaskStatus } from '@/entities/task/model/taskMeta.js';
import { taskService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { TaskDTO, TaskStatus } from '@/types/dto.js';
import {
  isColumnId,
  moveTask,
  positionInStatus,
  statusFromColumnId,
} from './taskBoardOrdering.js';

interface UseTaskBoardDndProps {
  tasks: TaskDTO[];
  onTasksChange: (tasks: TaskDTO[]) => void;
}

export function useTaskBoardDnd({ tasks, onTasksChange }: UseTaskBoardDndProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const statusForOver = useCallback((overId: string | null): TaskStatus | null => {
    if (!overId) return null;
    if (isColumnId(overId)) return statusFromColumnId(overId);
    const overTask = tasks.find((task) => task.id === overId);
    return overTask ? normalizeTaskStatus(overTask.status) : null;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverStatus(statusForOver(event.over?.id ? String(event.over.id) : null));
  }, [statusForOver]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverStatus(null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    setOverStatus(null);
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    const targetStatus = statusForOver(overId);
    const activeTask = tasks.find((task) => task.id === taskId);
    if (!activeTask || !targetStatus || overId === taskId || pendingRef.current.has(taskId)) return;

    const snapshot = tasks;
    const nextTasks = moveTask(tasks, taskId, overId, targetStatus);
    const nextPosition = positionInStatus(nextTasks, taskId, targetStatus);
    const statusChanged = activeTask.status !== targetStatus;

    pendingRef.current.add(taskId);
    onTasksChange(nextTasks);
    try {
      if (statusChanged) await taskService.setTaskStatus(taskId, targetStatus);
      await taskService.setTaskPosition(taskId, { position: nextPosition });
    } catch {
      onTasksChange(snapshot);
      showToast('Failed to move task');
    } finally {
      pendingRef.current.delete(taskId);
    }
  }, [onTasksChange, statusForOver, tasks]);

  const activeTask = useMemo(
    () => activeId ? tasks.find((task) => task.id === activeId) ?? null : null,
    [activeId, tasks],
  );

  return {
    activeTask,
    overStatus,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    handleDragEnd,
  };
}
