import React, { useMemo } from 'react';
import {
  closestCorners,
  DndContext,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { TaskDTO } from '@/types/dto.js';
import { TaskBoardColumn } from './TaskBoardColumn.js';
import { TaskDragOverlay } from './TaskDragOverlay.js';
import { groupTasksByStatus, TASK_BOARD_COLUMNS } from './taskBoardOrdering.js';
import { useTaskBoardDnd } from './useTaskBoardDnd.js';

export interface TaskBoardProps {
  tasks: TaskDTO[];
  onTasksChange: (tasks: TaskDTO[]) => void;
  canEdit?: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTasksChange, canEdit = true }) => {
  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const {
    activeTask,
    overStatus,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragCancel,
    handleDragEnd,
  } = useTaskBoardDnd({ tasks, onTasksChange });

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {TASK_BOARD_COLUMNS.map((col) => (
          <TaskBoardColumn
            key={col.id}
            col={col}
            tasks={tasksByStatus.get(col.id) ?? []}
            overStatus={overStatus}
            canEdit={canEdit}
          />
        ))}
      </motion.div>

      <TaskDragOverlay task={activeTask} canEdit={canEdit} />
    </DndContext>
  );
};
