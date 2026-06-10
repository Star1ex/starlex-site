import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/shared/lib/cn.js';
import type { TaskDTO, TaskStatus } from '@/types/dto.js';
import { SortableTaskBoardCard } from './TaskBoardCard.js';
import { columnId, type TaskBoardColumnConfig } from './taskBoardOrdering.js';

interface TaskBoardColumnProps {
  col: TaskBoardColumnConfig;
  tasks: TaskDTO[];
  overStatus: TaskStatus | null;
  canEdit: boolean;
}

export function TaskBoardColumn({ col, tasks, overStatus, canEdit }: TaskBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId(col.id),
    disabled: !canEdit,
    data: { type: 'column', status: col.id },
  });
  const highlighted = canEdit && (isOver || overStatus === col.id);

  return (
    <div className="flex flex-col gap-3 min-w-[220px] w-[220px] flex-shrink-0">
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
        <span className="label-caps text-[color:var(--sx-text-muted)]">{col.label}</span>
        <span className="ml-auto text-[10px] text-[color:var(--sx-text-subtle)] tabular-nums">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 min-h-[96px] rounded-2xl border border-transparent p-1 transition-all',
            highlighted && 'border-[color:var(--starlex-accent-border)] bg-[color:var(--starlex-accent-soft)]',
          )}
        >
          {tasks.map((task) => <SortableTaskBoardCard key={task.id} task={task} canEdit={canEdit} />)}
          {tasks.length === 0 && (
            <div className="h-16 rounded-xl border border-dashed border-[color:var(--sx-border)] flex items-center justify-center">
              <span className="text-label-sm text-[color:var(--sx-text-disabled)]">{canEdit ? 'Drop here' : 'No tasks'}</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
