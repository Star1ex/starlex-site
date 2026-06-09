import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { CalendarDays, Flag, GripVertical } from 'lucide-react';
import { taskService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import { cn } from '@/shared/lib/cn.js';
import type { TaskDTO, TaskStatus } from '@/types/dto.js';

interface Column {
  id: TaskStatus;
  label: string;
  dotClass: string;
}

const COLUMNS: Column[] = [
  { id: 'backlog', label: 'Backlog', dotClass: 'bg-white/30' },
  { id: 'todo', label: 'To Do', dotClass: 'bg-[#60a5fa]' },
  { id: 'in_progress', label: 'In Progress', dotClass: 'bg-[#a78bfa]' },
  { id: 'in_review', label: 'In Review', dotClass: 'bg-[#fb923c]' },
  { id: 'done', label: 'Done', dotClass: 'bg-[#34d399]' },
  { id: 'canceled', label: 'Canceled', dotClass: 'bg-white/20' },
];

const PRIORITY_COLOR: Record<string, string> = {
  urgent: '#f87171',
  high: '#fb923c',
  medium: '#a78bfa',
  low: '#60a5fa',
  none: '#64748b',
};

const columnId = (status: TaskStatus) => `column:${status}`;
const isColumnId = (id: string) => id.startsWith('column:');
const statusFromColumnId = (id: string) => id.replace('column:', '') as TaskStatus;

function fmtDue(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function moveTask(tasks: TaskDTO[], taskId: string, overId: string | null, targetStatus: TaskStatus): TaskDTO[] {
  const active = tasks.find((task) => task.id === taskId);
  if (!active) return tasks;

  const withoutActive = tasks.filter((task) => task.id !== taskId);
  let insertIndex = withoutActive.length;

  if (overId && !isColumnId(overId)) {
    const overIndex = withoutActive.findIndex((task) => task.id === overId);
    if (overIndex >= 0) insertIndex = overIndex;
  } else {
    for (let index = withoutActive.length - 1; index >= 0; index -= 1) {
      if ((withoutActive[index].status ?? 'backlog') === targetStatus) {
        insertIndex = index + 1;
        break;
      }
    }
  }

  const next = [...withoutActive];
  next.splice(insertIndex, 0, { ...active, status: targetStatus });
  return next;
}

function positionInStatus(tasks: TaskDTO[], taskId: string, status: TaskStatus) {
  return Math.max(0, tasks.filter((task) => task.status === status).findIndex((task) => task.id === taskId));
}

function TaskCard({ task, isDragging = false, canEdit }: { task: TaskDTO; isDragging?: boolean; canEdit: boolean }) {
  const priorityColor = PRIORITY_COLOR[task.priority ?? 'none'] ?? PRIORITY_COLOR.none;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  return (
    <div
      className={cn(
        'glass-card p-3 rounded-xl select-none transition-all',
        canEdit ? 'cursor-grab hover:border-white/20' : 'cursor-default',
        isDragging && 'opacity-50 scale-95',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-body-sm text-white leading-snug line-clamp-2 flex-1">
          {task.task || 'Untitled'}
        </span>
        <Flag size={12} style={{ color: priorityColor, flexShrink: 0, marginTop: 2 }} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {task.key && <span className="font-mono text-[10px] text-white/30 tabular-nums">{task.key}</span>}
        {task.due_date && (
          <span className={cn('flex items-center gap-1 text-[10px]', isOverdue ? 'text-[#f87171]' : 'text-white/40')}>
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
                  className="w-5 h-5 rounded-full border border-black bg-white/10 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden"
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

function SortableCard({ task, canEdit }: { task: TaskDTO; canEdit: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canEdit,
    data: { type: 'task', status: task.status },
  });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      {canEdit && (
        <div className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center text-white/20 cursor-grab">
          <GripVertical size={12} />
        </div>
      )}
      <div className={canEdit ? 'pl-5' : undefined}>
        <TaskCard task={task} isDragging={isDragging} canEdit={canEdit} />
      </div>
    </div>
  );
}

function BoardColumn({
  col,
  tasks,
  overStatus,
  canEdit,
}: {
  col: Column;
  tasks: TaskDTO[];
  overStatus: TaskStatus | null;
  canEdit: boolean;
}) {
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
        <span className="label-caps text-white/50">{col.label}</span>
        <span className="ml-auto text-[10px] text-white/30 tabular-nums">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            'flex flex-col gap-2 min-h-[96px] rounded-2xl border border-transparent p-1 transition-all',
            highlighted && 'border-[var(--accent)]/60 bg-white/[0.03] shadow-[0_0_24px_rgba(99,102,241,0.16)]',
          )}
        >
          {tasks.map((task) => <SortableCard key={task.id} task={task} canEdit={canEdit} />)}
          {tasks.length === 0 && (
            <div className="h-16 rounded-xl border border-dashed border-white/8 flex items-center justify-center">
              <span className="text-label-sm text-white/20">{canEdit ? 'Drop here' : 'No tasks'}</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface TaskBoardProps {
  tasks: TaskDTO[];
  onTasksChange: (tasks: TaskDTO[]) => void;
  canEdit?: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTasksChange, canEdit = true }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, TaskDTO[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const task of tasks) {
      const status = task.status ?? 'backlog';
      const bucket = map.get(status) ?? map.get('backlog');
      bucket?.push(task);
    }
    return map;
  }, [tasks]);

  const statusForOver = useCallback((overId: string | null): TaskStatus | null => {
    if (!overId) return null;
    if (isColumnId(overId)) return statusFromColumnId(overId);
    return tasks.find((task) => task.id === overId)?.status ?? null;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
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

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

  return (
    <DndContext
      sensors={canEdit ? sensors : []}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={(event) => setOverStatus(statusForOver(event.over?.id ? String(event.over.id) : null))}
      onDragCancel={() => { setActiveId(null); setOverStatus(null); }}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {COLUMNS.map((col) => (
          <BoardColumn
            key={col.id}
            col={col}
            tasks={tasksByStatus.get(col.id) ?? []}
            overStatus={overStatus}
            canEdit={canEdit}
          />
        ))}
      </motion.div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[200px] opacity-95 rotate-1">
            <TaskCard task={activeTask} canEdit={canEdit} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
