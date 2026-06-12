import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical } from 'lucide-react';
import { normalizeTaskPriority, TASK_PRIORITY_META } from '@/entities/task/model/taskMeta.js';
import { cn } from '@/shared/lib/cn.js';
import { Glass, type GlassDepth } from '@/shared/ui/glass/index.js';
import type { TaskDTO } from '@/types/dto.js';

function fmtDue(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TaskBoardCardProps {
  task: TaskDTO;
  isDragging?: boolean;
  canEdit: boolean;
  /** Drag overlay renders the card at a higher elevation. */
  depth?: GlassDepth;
}

export function TaskBoardCard({ task, isDragging = false, canEdit, depth = 'rest' }: TaskBoardCardProps) {
  const priorityMeta = TASK_PRIORITY_META[normalizeTaskPriority(task.priority)];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <Glass
      variant="card"
      depth={depth}
      interactive={canEdit}
      className={cn(
        'p-3 select-none',
        canEdit ? 'cursor-grab' : 'cursor-default',
        isDragging && 'opacity-50 scale-95',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-body-sm text-[color:var(--sx-text)] leading-snug line-clamp-2 flex-1">
          {task.task || 'Untitled'}
        </span>
        {task.priority !== 'none' && (
          <span
            className="sx-chip !min-h-0 !px-1.5 !py-0.5 text-[10px] flex-shrink-0"
            style={{ color: priorityMeta.color }}
          >
            <span className="sx-dot" />
            <span>{priorityMeta.label}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {task.key && <span className="font-mono text-[10px] text-[color:var(--sx-text-subtle)] tabular-nums">{task.key}</span>}
        {task.due_date && (
          <span className={cn('flex items-center gap-1 text-[10px]', isOverdue ? 'text-[color:var(--priority-urgent-text)]' : 'text-[color:var(--sx-text-subtle)]')}>
            <CalendarDays size={9} />
            {fmtDue(task.due_date)}
          </span>
        )}
        {task.labels?.slice(0, 2).map((label) => (
          <span
            key={label.id}
            className="sx-chip !min-h-0 !px-1.5 !py-0.5 text-[9px]"
            style={{ color: label.color }}
          >
            <span className="sx-dot" />
            {label.name}
          </span>
        ))}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center ml-auto">
            {task.assignees.slice(0, 3).map((assignee, index) => {
              const src = assignee.photo_url ?? assignee.avatar_url ?? undefined;
              const initials = [assignee.firstName?.[0], assignee.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
              return (
                <div
                  key={assignee.id}
                  className="w-5 h-5 rounded-full border border-[color:var(--sx-canvas)] bg-[color:var(--sx-surface-active)] flex items-center justify-center text-[8px] font-bold text-[color:var(--sx-text)] overflow-hidden"
                  style={{ zIndex: 10 - index, marginLeft: index > 0 ? -4 : 0 }}
                >
                  {src ? <img src={src} alt={initials} className="w-full h-full object-cover" /> : initials}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Glass>
  );
}

export function SortableTaskBoardCard({ task, canEdit }: { task: TaskDTO; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
    data: { type: 'task', status: task.status },
  });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      {canEdit && (
        <div className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center text-[color:var(--sx-text-disabled)] cursor-grab">
          <GripVertical size={12} />
        </div>
      )}
      <div className={canEdit ? 'pl-5' : undefined}>
        <TaskBoardCard task={task} isDragging={isDragging} canEdit={canEdit} />
      </div>
    </div>
  );
}
