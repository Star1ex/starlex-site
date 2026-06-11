import {
  CalendarDays,
  Check,
  ChevronDown,
  Flag,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_META,
} from '@/entities/task/model/taskMeta.js';
import { StatusMenu } from '@/features/taskStatus/StatusMenu.js';
import { InlineLabelChips, LabelPicker } from '@/shared/ui/LabelPicker.js';
import { Glass } from '@/shared/ui/glass/index.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  TaskDTO,
  TaskLabelDTO,
  TaskPriority,
  TaskStatus,
  WorkspaceMemberDTO,
} from '@/types/dto.js';

type AvatarUser = {
  firstName: string;
  lastName: string;
  photo_url?: string | null;
  avatar_url?: string | null;
};

interface TaskPropertiesPanelProps {
  task: TaskDTO;
  workspaceId: string | null;
  members: WorkspaceMemberDTO[];
  editable: boolean;
  isNew: boolean;
  onStatusChange: (status: TaskStatus) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onDueDateChange: (date: string | null) => void;
  onAssigneeToggle: (userId: string) => void;
  onLabelsChange: (labels: TaskLabelDTO[]) => void;
}

function initials(firstName: string, lastName: string) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
}

function dueDateValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function dueDateLabel(value?: string | null) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function priorityConfig(priority: TaskPriority) {
  return TASK_PRIORITY_META[priority] ?? TASK_PRIORITY_META.none;
}

function AssigneeAvatar({ member }: { member: AvatarUser }) {
  const src = member.photo_url ?? member.avatar_url ?? undefined;
  const ini = initials(member.firstName, member.lastName);
  return (
    <div className="w-6 h-6 rounded-full bg-[color:var(--sx-surface-active)] flex items-center justify-center text-[10px] font-semibold text-[color:var(--sx-text)] overflow-hidden flex-shrink-0">
      {src ? <img src={src} alt={ini} className="w-full h-full object-cover" /> : ini}
    </div>
  );
}

function PropertyBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="task-property-block">
      <p>{label}</p>
      {children}
    </div>
  );
}

interface PriorityMenuProps {
  priority: TaskPriority;
  canEdit: boolean;
  onChange: (priority: TaskPriority) => void;
}

function PriorityMenu({ priority, canEdit, onChange }: PriorityMenuProps) {
  const selected = priorityConfig(priority);

  if (!canEdit) {
    return (
      <span className="inline-flex items-center gap-2 text-label-sm font-medium" style={{ color: selected.color }}>
        <Flag size={13} />
        {selected.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full h-9 flex items-center justify-between rounded-lg bg-[color:var(--sx-surface)] hover:bg-[color:var(--sx-surface-hover)] px-3 text-label-sm transition-colors"
        >
          <span className="flex items-center gap-2 font-medium" style={{ color: selected.color }}>
            <Flag size={13} />
            {selected.label}
          </span>
          <ChevronDown size={14} className="text-[color:var(--sx-text-subtle)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="glass-menu min-w-[180px] rounded-xl p-1"
      >
        {TASK_PRIORITIES.map((priorityValue) => {
          const priorityMeta = TASK_PRIORITY_META[priorityValue];
          return (
            <DropdownMenuItem
              key={priorityValue}
              onSelect={() => onChange(priorityValue)}
              className="glass-menu-item flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-[color:var(--sx-surface-hover)] focus:bg-[color:var(--sx-surface-hover)]"
              style={{ color: priorityMeta.color }}
            >
              <Flag size={13} />
              <span className="text-label-sm">{priorityMeta.label}</span>
              {priorityValue === priority && <Check size={13} className="ml-auto text-[color:var(--sx-text-muted)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AssigneeControlProps {
  members: WorkspaceMemberDTO[];
  assignees: NonNullable<TaskDTO['assignees']>;
  canEdit: boolean;
  onToggle: (userId: string) => void;
}

function AssigneeControl({ members, assignees, canEdit, onToggle }: AssigneeControlProps) {
  const selectedIds = assignees.map((assignee) => assignee.id);

  return (
    <div className="space-y-2">
      {assignees.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {assignees.map((assignee) => (
            <div key={assignee.id} className="flex items-center gap-2 rounded-lg bg-[color:var(--sx-surface)] px-2.5 py-2">
              <AssigneeAvatar member={assignee} />
              <span className="min-w-0 flex-1 truncate text-label-sm text-[color:var(--sx-text)]">
                {assignee.firstName} {assignee.lastName}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onToggle(assignee.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-surface-hover)] transition-colors"
                  aria-label="Remove assignee"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-label-sm text-[color:var(--sx-text-subtle)]">No assignees</p>
      )}

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full h-9 flex items-center justify-between rounded-lg bg-[color:var(--sx-surface)] hover:bg-[color:var(--sx-surface-hover)] px-3 text-label-sm text-[color:var(--sx-text-muted)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Plus size={13} />
                Assign people
              </span>
              <ChevronDown size={14} className="text-[color:var(--sx-text-subtle)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="glass-menu min-w-[240px] max-h-72 rounded-xl p-1"
          >
            {members.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[color:var(--sx-text-subtle)]">No workspace members loaded.</p>
            ) : (
              members.map((member) => {
                const active = selectedIds.includes(member.user.id);
                return (
                  <DropdownMenuCheckboxItem
                    key={member.user.id}
                    checked={active}
                    onSelect={(event) => {
                      event.preventDefault();
                      onToggle(member.user.id);
                    }}
                    className="glass-menu-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-[color:var(--sx-surface-hover)] focus:bg-[color:var(--sx-surface-hover)]"
                  >
                    <AssigneeAvatar member={member.user} />
                    <span className={`min-w-0 flex-1 truncate text-label-sm ${active ? 'text-[color:var(--sx-text)]' : 'text-[color:var(--sx-text-muted)]'}`}>
                      {member.user.firstName} {member.user.lastName}
                    </span>
                    {active && <Check size={13} className="text-[color:var(--sx-text-muted)]" />}
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function TaskPropertiesPanel({
  task,
  workspaceId,
  members,
  editable,
  isNew,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onAssigneeToggle,
  onLabelsChange,
}: TaskPropertiesPanelProps) {
  const selectedLabels = (task.labels ?? []) as TaskLabelDTO[];
  const selectedAssignees = task.assignees ?? [];

  return (
    <Glass as="aside" variant="panel" depth="raised" className="task-properties-panel">
      <div className="task-properties-head">
        <div>
          <Tag size={15} />
        </div>
        <div>
          <h2>Properties</h2>
          <p>Status, people, labels, date</p>
        </div>
      </div>

      <PropertyBlock label="Status">
        <StatusMenu
          taskId={task.id}
          status={task.status}
          canEdit={editable}
          onStatusChange={onStatusChange}
        />
      </PropertyBlock>

      <PropertyBlock label="Priority">
        <PriorityMenu priority={task.priority} canEdit={editable} onChange={onPriorityChange} />
      </PropertyBlock>

      <PropertyBlock label="Due date">
        {editable ? (
          <div className="flex items-center gap-2">
            <label className="relative flex-1">
              <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--sx-text-subtle)] pointer-events-none" />
              <input
                type="date"
                value={dueDateValue(task.due_date)}
                onChange={(e) => onDueDateChange(e.target.value ? `${e.target.value}T00:00:00Z` : null)}
                className="w-full h-9 rounded-lg bg-[color:var(--sx-surface)] pl-9 pr-3 text-label-sm text-[color:var(--sx-text-muted)] outline-none hover:bg-[color:var(--sx-surface-hover)] focus:shadow-[var(--sx-focus-ring)] [color-scheme:inherit]"
              />
            </label>
            {task.due_date && (
              <button
                type="button"
                onClick={() => onDueDateChange(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-surface-hover)] transition-colors"
                aria-label="Clear due date"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-label-sm text-[color:var(--sx-text-muted)]">
            <CalendarDays size={13} />
            {dueDateLabel(task.due_date)}
          </span>
        )}
      </PropertyBlock>

      <PropertyBlock label="Assignees">
        <AssigneeControl
          members={members}
          assignees={selectedAssignees}
          canEdit={editable}
          onToggle={onAssigneeToggle}
        />
      </PropertyBlock>

      <PropertyBlock label="Labels">
        <div className="space-y-2">
          {selectedLabels.length > 0 ? (
            <InlineLabelChips labels={selectedLabels} maxVisible={8} />
          ) : (
            <p className="text-label-sm text-[color:var(--sx-text-subtle)]">No labels</p>
          )}
          {editable && (
            <LabelPicker
              workspaceId={workspaceId ?? ''}
              selected={selectedLabels}
              onChange={onLabelsChange}
              label="Edit labels"
              triggerClassName="w-full h-9 flex items-center justify-between rounded-lg bg-[color:var(--sx-surface)] hover:bg-[color:var(--sx-surface-hover)] px-3 text-label-sm text-[color:var(--sx-text-muted)] transition-colors disabled:opacity-40"
            />
          )}
        </div>
      </PropertyBlock>

      {!isNew && (
        <div className="task-updated-at">
          Updated {task.updated_at ? new Date(task.updated_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'recently'}
        </div>
      )}
    </Glass>
  );
}
