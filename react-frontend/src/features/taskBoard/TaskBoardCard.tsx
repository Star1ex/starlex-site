import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Flag, GripVertical } from 'lucide-react';
import { normalizeTaskPriority, TASK_PRIORITY_META } from '@/entities/task/model/taskMeta.js';
import { cn } from '@/shared/lib/cn.js';
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
}

export function TaskBoardCard({ task, isDragging = false, canEdit }: TaskBoardCardProps) {
  const priorityColor = TASK_PRIORITY_META[normalizeTaskPriority(task.priority)].color;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      className={cn(
        'glass-card p-3 rounded-xl select-none transition-all',
        canEdit ? 'cursor-grab hover:border-[color:var(--sx-border-strong)]' : 'cursor-default',
        isDragging && 'opacity-50 scale-95',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-body-sm text-[color:var(--sx-text)] leading-snug line-clamp-2 flex-1">
          {task.task || 'Untitled'}
        </span>
        <Flag size={12} style={{ color: priorityColor, flexShrink: 0, marginTop: 2 }} />
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
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: `${label.color}22`, color: label.color, border: `1px solid ${label.color}44` }}
          >
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
                  className="w-5 h-5 rounded-full border border-[color:var(--sx-canvas)] bg-[color:var(--sx-panel-strong)] flex items-center justify-center text-[8px] font-bold text-[color:var(--sx-text)] overflow-hidden"
                  style={{ zIndex: 10 - index, marginLeft: index > 0 ? -4 : 0 }}
                >
                  {src ? <img src={src} alt={initials} className="w-full h-full object-cover" /> : initials}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
