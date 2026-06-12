import { Plus } from 'lucide-react';

interface TaskExplorerHeaderProps {
  taskCount: number;
  activeFilterCount: number;
  canCreate: boolean;
  onCreateTask: () => void;
}

export function TaskExplorerHeader({
  taskCount,
  activeFilterCount,
  canCreate,
  onCreateTask,
}: TaskExplorerHeaderProps) {
  return (
    <div className="tasks-page-header">
      <div>
        <h1>All Tasks</h1>
        <p>{taskCount} task{taskCount !== 1 ? 's' : ''}{activeFilterCount > 0 ? ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}` : ''}</p>
      </div>
      <div>
        {canCreate && (
          <button
            onClick={onCreateTask}
            className="liquid-button flex items-center gap-1.5 px-3 py-1.5 text-label-sm"
          >
            <Plus size={13} /> New task
          </button>
        )}
      </div>
    </div>
  );
}
