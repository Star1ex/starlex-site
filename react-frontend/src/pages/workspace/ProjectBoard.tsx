import React, { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, Flag, CalendarDays } from 'lucide-react';
import { taskService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { TaskDTO, TaskStatus } from '@/types/dto.js';

// ─── column config ─────────────────────────────────────────────────────────────

interface Column {
  id: TaskStatus;
  label: string;
  dotClass: string;
}

const COLUMNS: Column[] = [
  { id: 'backlog',     label: 'Backlog',      dotClass: 'bg-white/30' },
  { id: 'todo',        label: 'To Do',        dotClass: 'bg-[#60a5fa]' },
  { id: 'in_progress', label: 'In Progress',  dotClass: 'bg-[#a78bfa]' },
  { id: 'in_review',   label: 'In Review',    dotClass: 'bg-[#fb923c]' },
  { id: 'done',        label: 'Done',         dotClass: 'bg-[#34d399]' },
];

const PRIORITY_COLOR: Record<string, string> = {
  high:   '#f87171',
  medium: '#fbbf24',
  low:    '#60a5fa',
};

// ─── helpers ───────────────────────────────────────────────────────────────────

function fmtDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── task card ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: TaskDTO;
  isDragging?: boolean;
}

function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const priorityColor = PRIORITY_COLOR[task.priority ?? 'medium'] ?? '#fbbf24';
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <div
      className={`glass-card p-3 rounded-xl cursor-grab select-none transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-body-sm text-white leading-snug line-clamp-2 flex-1">
          {task.task || 'Untitled'}
        </span>
        <Flag size={12} style={{ color: priorityColor, flexShrink: 0, marginTop: 2 }} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {task.key && (
          <span className="font-mono text-[10px] text-white/30 tabular-nums">{task.key}</span>
        )}
        {task.due_date && (
          <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-[#f87171]' : 'text-white/40'}`}>
            <CalendarDays size={9} />
            {fmtDue(task.due_date)}
          </span>
        )}
        {task.labels && task.labels.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {task.labels.slice(0, 2).map(l => (
              <span
                key={l.id}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: `${l.color}22`, color: l.color, border: `1px solid ${l.color}44` }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center ml-auto" style={{ gap: -4 }}>
            {task.assignees.slice(0, 3).map((a, i) => {
              const src = a.photo_url ?? a.avatar_url ?? undefined;
              const initials = [a.firstName?.[0], a.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
              return (
                <div
                  key={a.id}
                  className="w-5 h-5 rounded-full border border-black bg-white/10 flex items-center justify-center text-[8px] font-bold text-white overflow-hidden"
                  style={{ zIndex: 10 - i, marginLeft: i > 0 ? -4 : 0 }}
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

// ─── sortable card wrapper ──────────────────────────────────────────────────────

function SortableCard({ task }: { task: TaskDTO }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center text-white/20 cursor-grab">
        <GripVertical size={12} />
      </div>
      <div className="pl-5">
        <TaskCard task={task} isDragging={isDragging} />
      </div>
    </div>
  );
}

// ─── board column ──────────────────────────────────────────────────────────────

function BoardColumn({ col, tasks }: { col: Column; tasks: TaskDTO[] }) {
  return (
    <div className="flex flex-col gap-3 min-w-[220px] w-[220px] flex-shrink-0">
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
        <span className="label-caps text-white/50">{col.label}</span>
        <span className="ml-auto text-[10px] text-white/30 tabular-nums">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[80px]">
          {tasks.map(t => <SortableCard key={t.id} task={t} />)}
          {tasks.length === 0 && (
            <div className="h-16 rounded-xl border border-dashed border-white/8 flex items-center justify-center">
              <span className="text-label-sm text-white/20">No tasks</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── main board ────────────────────────────────────────────────────────────────

interface ProjectBoardProps {
  tasks: TaskDTO[];
  onTasksChange: (tasks: TaskDTO[]) => void;
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({ tasks, onTasksChange }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pendingRef = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByStatus = useCallback(() => {
    const map = new Map<TaskStatus, TaskDTO[]>();
    for (const col of COLUMNS) map.set(col.id, []);
    for (const t of tasks) {
      const status = (t.status as TaskStatus) ?? 'backlog';
      const bucket = map.get(status) ?? map.get('backlog')!;
      bucket.push(t);
    }
    return map;
  }, [tasks]);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(e.active.id);
    const overId  = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;

    const targetStatus = (COLUMNS.find(c => c.id === overId)?.id
      ?? tasks.find(t => t.id === overId)?.status) as TaskStatus | undefined;
    if (!targetStatus) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    if (pendingRef.current.has(taskId)) return;

    pendingRef.current.add(taskId);
    const snapshot = tasks;
    onTasksChange(tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await taskService.patchTaskStatus(taskId, targetStatus);
    } catch {
      onTasksChange(snapshot);
      showToast('Failed to update task status');
    } finally {
      pendingRef.current.delete(taskId);
    }
  }, [tasks, onTasksChange]);

  const byStatus = tasksByStatus();
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {COLUMNS.map(col => (
          <BoardColumn key={col.id} col={col} tasks={byStatus.get(col.id) ?? []} />
        ))}
      </motion.div>

      <DragOverlay>
        {activeTask ? (
          <div className="w-[200px] opacity-90 rotate-1">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
