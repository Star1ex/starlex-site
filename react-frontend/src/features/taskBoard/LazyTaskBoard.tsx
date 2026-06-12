import React, { Suspense } from 'react';
import type { TaskBoardProps } from './TaskBoard.js';

const TaskBoard = React.lazy(() => import('./TaskBoard.js').then((module) => ({ default: module.TaskBoard })));

export function TaskBoardSkeleton() {
  return (
    <div className="task-board-skeleton" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, columnIndex) => (
        <div key={columnIndex} className="task-board-skeleton__column">
          <div className="task-board-skeleton__header" />
          {Array.from({ length: 3 }).map((__, rowIndex) => (
            <div key={rowIndex} className="task-board-skeleton__card">
              <div />
              <span />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function LazyTaskBoard(props: TaskBoardProps) {
  return (
    <Suspense fallback={<TaskBoardSkeleton />}>
      <TaskBoard {...props} />
    </Suspense>
  );
}
