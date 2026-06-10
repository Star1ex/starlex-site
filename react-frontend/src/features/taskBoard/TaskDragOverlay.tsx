import { DragOverlay } from '@dnd-kit/core';
import type { TaskDTO } from '@/types/dto.js';
import { TaskBoardCard } from './TaskBoardCard.js';

interface TaskDragOverlayProps {
  task: TaskDTO | null;
  canEdit: boolean;
}

export function TaskDragOverlay({ task, canEdit }: TaskDragOverlayProps) {
  return (
    <DragOverlay>
      {task ? (
        <div className="w-[200px] opacity-95 rotate-1">
          <TaskBoardCard task={task} canEdit={canEdit} />
        </div>
      ) : null}
    </DragOverlay>
  );
}
