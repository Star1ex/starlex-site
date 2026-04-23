import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import DraggableItem from './DraggableItem.js';
import type { TaskDTO } from '@/types/dto.js';
import { taskService } from '@/services/api/index.js';

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function TaskCardContent({ task, isOverlay = false }: { task: TaskDTO; isOverlay?: boolean }) {
  return (
    <div
      className={`p-3 rounded-xl bg-white dark:bg-dark-surface transition-all ${
        isOverlay
          ? 'shadow-lifted scale-[1.03] rotate-[0.5deg] ring-1 ring-black/5 dark:ring-white/5'
          : 'shadow-card hover:shadow-card-hover hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900 dark:text-dark-text">{task.task}</div>
        <div className="text-xs text-gray-500 dark:text-dark-text-muted">{task.priority}</div>
      </div>
      <div className="mt-2 text-xs text-gray-600 dark:text-dark-text-muted line-clamp-3">
        {stripHtml(task.description || '')}
      </div>
    </div>
  );
}

export default function DraggableTaskList({
  initialTasks,
  onOrderChange,
}: {
  initialTasks: TaskDTO[];
  onOrderChange?: (t: TaskDTO[]) => void;
}) {
  const [items, setItems] = useState<TaskDTO[]>(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });

  const activeTask = activeId ? items.find((i) => i.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onOrderChange?.(newItems);

      try {
        if (over.id === 'root') {
          await taskService.moveTaskToFolder(active.id as string, null);
        }
      } catch (err) {
        // Rollback on error
        setItems(items);
        onOrderChange?.(items);
      }
    }
  };

  return (
    <DndContext
      sensors={useSensors(sensors)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {items.map((t) => (
            <DraggableItem key={t.id} id={t.id}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') window.location.href = `/task/${t.id}`;
                }}
                onClick={() => {
                  window.location.href = `/task/${t.id}`;
                }}
                aria-label={`Open task ${t.task}`}
                style={{ opacity: activeId === t.id ? 0 : 1 }}
              >
                <TaskCardContent task={t} />
              </div>
            </DraggableItem>
          ))}
        </motion.div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? <TaskCardContent task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
