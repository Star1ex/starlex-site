import React, { Suspense } from 'react';
import TaskBoard from '@/features/taskBoard/LazyTaskBoard.js';
import { TaskExplorerFilters } from './TaskExplorerFilters.js';
import { TaskRow } from './TaskExplorerList.js';
import type {
  TaskCategoriesResponse,
  TaskDTO,
  TaskLabelDTO,
  TaskPriority,
  TaskQueryParams,
  TaskStatus,
  WorkspaceMemberDTO,
} from '@/types/dto.js';
import type { TaskExplorerViewMode } from './TaskExplorerToolbar.js';

const TASK_VIRTUALIZATION_THRESHOLD = 100;

type VirtuosoTaskProps = {
  className?: string;
  data: TaskDTO[];
  computeItemKey: (index: number, task: TaskDTO) => string;
  increaseViewportBy: { top: number; bottom: number };
  itemContent: (index: number, task: TaskDTO) => React.ReactNode;
};

const Virtuoso = React.lazy(
  () => import('react-virtuoso').then((module) => ({ default: module.Virtuoso })),
) as React.LazyExoticComponent<React.ComponentType<VirtuosoTaskProps>>;

interface VirtualTaskRowsProps {
  tasks: TaskDTO[];
  renderTaskRow: (task: TaskDTO) => React.ReactNode;
}

function VirtualTaskRows({ tasks, renderTaskRow }: VirtualTaskRowsProps) {
  return (
    <Suspense fallback={<div className="tasks-virtual-list">{tasks.slice(0, 24).map(renderTaskRow)}</div>}>
      <Virtuoso
        className="tasks-virtual-list"
        data={tasks}
        computeItemKey={(_: number, task: TaskDTO) => task.id}
        increaseViewportBy={{ top: 180, bottom: 360 }}
        itemContent={(_: number, task: TaskDTO) => renderTaskRow(task)}
      />
    </Suspense>
  );
}

interface TaskExplorerContentProps {
  showRail: boolean;
  categories: TaskCategoriesResponse | null;
  params: TaskQueryParams;
  onFilterChange: (update: Partial<TaskQueryParams>) => void;
  loading: boolean;
  tasks: TaskDTO[];
  activeFilterCount: number;
  onClearFilters: () => void;
  viewMode: TaskExplorerViewMode;
  onTasksChange: (tasks: TaskDTO[]) => void;
  canEdit: boolean;
  workspaceId: string;
  members: WorkspaceMemberDTO[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onTitleChange: (id: string, title: string) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onLabelsChange: (id: string, labels: TaskLabelDTO[]) => void;
  onAssigneeToggle: (id: string, userId: string) => void;
  onDueDateChange: (id: string, dueDate: string | null) => void;
  onOpenTask: (id: string) => void;
  nextCursor: string | null;
  onLoadMore: () => void;
}

function TaskExplorerLoading() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="tasks-loading-row animate-pulse">
          <div className="w-16 h-4 bg-[color:var(--sx-control)] rounded-full" />
          <div className="flex-1 h-3 bg-[color:var(--sx-control)] rounded-full" />
          <div className="w-12 h-4 bg-[color:var(--sx-control)] rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TaskExplorerContent({
  showRail,
  categories,
  params,
  onFilterChange,
  loading,
  tasks,
  activeFilterCount,
  onClearFilters,
  viewMode,
  onTasksChange,
  canEdit,
  workspaceId,
  members,
  onStatusChange,
  onTitleChange,
  onPriorityChange,
  onLabelsChange,
  onAssigneeToggle,
  onDueDateChange,
  onOpenTask,
  nextCursor,
  onLoadMore,
}: TaskExplorerContentProps) {
  const renderTaskRow = (task: TaskDTO) => (
    <TaskRow
      key={task.id}
      task={task}
      workspaceId={workspaceId}
      members={members}
      canEdit={canEdit}
      onStatusChange={onStatusChange}
      onTitleChange={onTitleChange}
      onPriorityChange={onPriorityChange}
      onLabelsChange={onLabelsChange}
      onAssigneeToggle={onAssigneeToggle}
      onDueDateChange={onDueDateChange}
      onClick={onOpenTask}
    />
  );

  return (
    <div className={`tasks-layout ${showRail ? '' : 'tasks-layout--full'}`}>
      {showRail && (
        <TaskExplorerFilters categories={categories} params={params} onChange={onFilterChange} />
      )}

      <div className="tasks-table-shell">
        {loading ? (
          <TaskExplorerLoading />
        ) : tasks.length === 0 ? (
          <div className="tasks-empty-state">
            <p>No tasks match</p>
            {activeFilterCount > 0 && (
              <button onClick={onClearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === 'board' ? (
          <div className="p-4">
            <TaskBoard tasks={tasks} onTasksChange={onTasksChange} canEdit={canEdit} />
          </div>
        ) : (
          <>
            <div className="tasks-table-head">
              <span>Status</span>
              <span>Key</span>
              <span>Title</span>
              <span>Priority</span>
              <span>Labels</span>
              <span>Assignee</span>
              <span>Due</span>
            </div>
            {tasks.length > TASK_VIRTUALIZATION_THRESHOLD ? (
              <VirtualTaskRows tasks={tasks} renderTaskRow={renderTaskRow} />
            ) : (
              tasks.map(renderTaskRow)
            )}
            {nextCursor && (
              <div className="tasks-load-more">
                <button onClick={onLoadMore}>
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
