import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { taskService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import type { TaskStatus } from '@/types/dto.js';

export const STATUS_CONFIG: Record<TaskStatus, { label: string; pillClass: string; dot: string }> = {
  backlog:     { label: 'Backlog',      dot: '#475569', pillClass: 'bg-white/8 text-white/50' },
  todo:        { label: 'To Do',        dot: '#60a5fa', pillClass: 'bg-blue-500/15 text-blue-300' },
  in_progress: { label: 'In Progress',  dot: '#a78bfa', pillClass: 'bg-violet-500/15 text-violet-300' },
  in_review:   { label: 'In Review',    dot: '#fb923c', pillClass: 'bg-orange-500/15 text-orange-300' },
  done:        { label: 'Done',         dot: '#34d399', pillClass: 'bg-emerald-500/15 text-emerald-300' },
  canceled:    { label: 'Canceled',     dot: '#64748b', pillClass: 'bg-white/5 text-white/30' },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as TaskStatus[];

interface StatusPillProps {
  status: TaskStatus;
  small?: boolean;
}

export function StatusPill({ status, small }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.backlog;
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${cfg.pillClass} ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-label-sm px-2.5 py-1'}`}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

interface StatusMenuProps {
  taskId: string;
  status: TaskStatus;
  canEdit: boolean;
  onStatusChange?: (next: TaskStatus) => void;
}

export const StatusMenu: React.FC<StatusMenuProps> = ({ taskId, status, canEdit, onStatusChange }) => {
  const [optimistic, setOptimistic] = React.useState<TaskStatus>(status);

  React.useEffect(() => { setOptimistic(status); }, [status]);

  if (!canEdit) return <StatusPill status={optimistic} />;

  const handleSelect = async (next: TaskStatus) => {
    if (next === optimistic) return;
    const prev = optimistic;
    setOptimistic(next);
    onStatusChange?.(next);
    try {
      await taskService.setTaskStatus(taskId, next);
    } catch {
      setOptimistic(prev);
      onStatusChange?.(prev);
      showToast('Failed to update status');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="focus:outline-none">
          <StatusPill status={optimistic} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="glass-card border-white/10 bg-black/80 backdrop-blur-2xl min-w-[160px] p-1"
        align="start"
      >
        {ALL_STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <DropdownMenuItem
              key={s}
              onSelect={() => handleSelect(s)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-white/8 focus:bg-white/8 text-white/70"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
              <span className="text-label-sm">{cfg.label}</span>
              {s === optimistic && (
                <svg className="ml-auto w-3 h-3 text-white/50" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
