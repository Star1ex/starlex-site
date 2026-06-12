import {
  isTaskPriority,
  isTaskStatus,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
} from '@/entities/task/model/taskMeta.js';
import type { TaskCategoriesResponse, TaskQueryParams } from '@/types/dto.js';

interface TaskExplorerFiltersProps {
  categories: TaskCategoriesResponse | null;
  params: TaskQueryParams;
  onChange: (update: Partial<TaskQueryParams>) => void;
}

export function TaskExplorerFilters({ categories, params, onChange }: TaskExplorerFiltersProps) {
  if (!categories) return <div className="tasks-filter-rail" />;

  const groups = categories.categories;
  const statusGroup  = groups.find((g) => g.type === 'status');
  const priorityGroup = groups.find((g) => g.type === 'priority');
  const projectGroup  = groups.find((g) => g.type === 'project');
  const assigneeGroup = groups.find((g) => g.type === 'assignee');

  return (
    <aside className="tasks-filter-rail">
      {statusGroup && statusGroup.items.length > 0 && (
        <div className="tasks-filter-section">
          <p>Status</p>
          <div>
            {statusGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ status: params.status === item.id ? undefined : item.id, cursor: undefined })}
                className="tasks-filter-item"
                data-active={params.status === item.id ? 'true' : undefined}
              >
                <span>{isTaskStatus(item.id) ? TASK_STATUS_META[item.id].label : item.name}</span>
                <b>{item.count}</b>
              </button>
            ))}
          </div>
        </div>
      )}
      {priorityGroup && priorityGroup.items.length > 0 && (
        <div className="tasks-filter-section">
          <p>Priority</p>
          <div>
            {priorityGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ priority: params.priority === item.id ? undefined : item.id, cursor: undefined })}
                className="tasks-filter-item"
                data-active={params.priority === item.id ? 'true' : undefined}
                style={{ ['--filter-color' as string]: isTaskPriority(item.id) ? TASK_PRIORITY_META[item.id].color : 'var(--sx-text-subtle)' }}
              >
                <span>{isTaskPriority(item.id) ? TASK_PRIORITY_META[item.id].label : item.name.charAt(0).toUpperCase() + item.name.slice(1)}</span>
                <b>{item.count}</b>
              </button>
            ))}
          </div>
        </div>
      )}
      {projectGroup && projectGroup.items.length > 0 && (
        <div className="tasks-filter-section">
          <p>Project</p>
          <div>
            {projectGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ project_id: params.project_id === item.id ? undefined : item.id, cursor: undefined })}
                className="tasks-filter-item"
                data-active={params.project_id === item.id ? 'true' : undefined}
              >
                <span className="truncate">{item.id === '__none' ? 'No project' : item.name}</span>
                <b>{item.count}</b>
              </button>
            ))}
          </div>
        </div>
      )}
      {assigneeGroup && assigneeGroup.items.length > 0 && (
        <div className="tasks-filter-section">
          <p>Assignee</p>
          <div>
            {assigneeGroup.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onChange({ assignee_id: params.assignee_id === item.id ? undefined : item.id, cursor: undefined })}
                className="tasks-filter-item"
                data-active={params.assignee_id === item.id ? 'true' : undefined}
              >
                <span className="truncate">{item.id === '__none' ? 'Unassigned' : item.name}</span>
                <b>{item.count}</b>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
