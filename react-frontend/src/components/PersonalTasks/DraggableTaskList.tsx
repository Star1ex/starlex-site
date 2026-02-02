import React, { useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableItem from './DraggableItem.js';
import type { TaskDTO } from '@/types/dto.js';
import { taskService } from '@/services/api/index.js';

export default function DraggableTaskList({ initialTasks, onOrderChange }: { initialTasks: TaskDTO[]; onOrderChange?: (t: TaskDTO[]) => void }) {
  const [items, setItems] = useState<TaskDTO[]>(initialTasks);
  const sensors = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onOrderChange?.(newItems);

      // TODO: persist order via API if backend supports it
      try {
        // optimistic: if dropped on special id 'root', we interpret as remove from folder
        if (over.id === 'root') {
          await taskService.moveTaskToFolder(active.id as string, null);
        }
      } catch (err) {
        console.error('Error during drag operation:', err);
        // rollback on error
        setItems(items);
        onOrderChange?.(items);
      }
    }
  };

  return (
    <DndContext sensors={useSensors(sensors)} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((t) => (
            <DraggableItem key={t.id} id={t.id}>
              <div
                role="button"
                tabIndex={0}
                className="p-3 border rounded bg-white dark:bg-dark-surface transition-shadow transform hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400"
                onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/task/${t.id}`; }}
                onClick={() => window.location.href = `/task/${t.id}`}
                aria-label={`Open task ${t.task}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900 dark:text-dark-text">{t.task}</div>
                  <div className="text-xs text-gray-500 dark:text-dark-text-muted">{t.priority}</div>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-dark-text-muted line-clamp-3">{t.description}</div>
              </div>
            </DraggableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
