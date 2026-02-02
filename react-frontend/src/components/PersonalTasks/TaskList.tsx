import React, { useMemo } from 'react';
import type { TaskDTO } from '@/types/dto.js';
import VirtualList from '@/components/Virtualized/VirtualList.js';

function TaskListComponent({ tasks }: { tasks: TaskDTO[] }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-sm text-gray-500">No tasks yet — create one using +</div>;
  }

  const renderItem = useMemo(
    () => (t: TaskDTO) => (
      <div className="p-3 border rounded hover:shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{t.task}</div>
          <div className="text-xs text-gray-500">{t.priority}</div>
        </div>
        <div className="mt-2 text-xs text-gray-600 line-clamp-3">{t.description}</div>
      </div>
    ),
    []
  );

  return <VirtualList items={tasks} renderItem={renderItem} threshold={80} estimatedItemHeight={88} className="space-y-3" />;
}

const TaskList = React.memo(TaskListComponent);
TaskList.displayName = 'TaskList';
export default TaskList;
