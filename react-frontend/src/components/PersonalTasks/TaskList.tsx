import React from 'react';
import type { TaskDTO } from '@/types/dto.js';

export default function TaskList({ tasks }: { tasks: TaskDTO[] }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-gray-500">No tasks yet — create one using +</div>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t.id} className="p-3 border rounded hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{t.task}</div>
            <div className="text-xs text-gray-500">{t.priority}</div>
          </div>
          <div className="mt-2 text-xs text-gray-600 line-clamp-3">{t.description}</div>
        </div>
      ))}
    </div>
  );
}
