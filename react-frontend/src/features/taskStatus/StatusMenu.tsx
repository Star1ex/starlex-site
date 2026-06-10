import React from 'react';
import { Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TASK_STATUSES, TASK_STATUS_META } from '@/entities/task/model/taskMeta.js';
import { taskService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { TaskStatus } from '@/types/dto.js';

interface StatusPillProps {
  status: TaskStatus;
  small?: boolean;
}

export function StatusPill({ status, small }: StatusPillProps) {
  const cfg = TASK_STATUS_META[status] ?? TASK_STATUS_META.backlog;
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${cfg.pillClass} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-label-sm px-2.5 py-1'}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

interface StatusMenuProps {
  taskId?: string;
  status: TaskStatus;
  canEdit: boolean;
  onStatusChange?: (next: TaskStatus) => void;
}

export const StatusMenu: React.FC<StatusMenuProps> = ({ taskId, status, canEdit, onStatusChange }) => {
  const [optimistic, setOptimistic] = React.useState<TaskStatus>(status);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => { setOptimistic(status); }, [status]);

  if (!canEdit) return <StatusPill status={optimistic} />;

  const handleSelect = async (next: TaskStatus) => {
    if (next === optimistic) return;
    const prev = optimistic;
    setOptimistic(next);
    onStatusChange?.(next);
    if (!taskId) return;
    setPending(true);
    try {
      await taskService.setTaskStatus(taskId, next);
    } catch {
      setOptimistic(prev);
      onStatusChange?.(prev);
      showToast('Failed to update status');
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="focus:outline-none disabled:cursor-not-allowed disabled:opacity-60" disabled={pending}>
          <StatusPill status={optimistic} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="glass-menu min-w-[160px] rounded-xl p-1"
        align="start"
      >
        {TASK_STATUSES.map((s) => {
          const cfg = TASK_STATUS_META[s];
          return (
            <DropdownMenuItem
              key={s}
              onSelect={() => handleSelect(s)}
              className="glass-menu-item flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[color:var(--sx-control)] focus:bg-[color:var(--sx-control)]"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
              <span className="text-label-sm">{cfg.label}</span>
              {s === optimistic && (
                <Check className="ml-auto w-3 h-3 text-[color:var(--sx-text-muted)]" strokeWidth={1.65} />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
