import {
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_META,
} from '@/entities/task/model/taskMeta.js';
import { StatusMenu } from '@/features/taskStatus/StatusMenu.js';
import { LabelPicker } from '@/shared/ui/LabelPicker.js';
import { preloadTaskDetailShell } from '@/app/routePreload.js';
import { DatePickerMenu } from '@/shared/ui/DatePickerMenu.js';
import { toPickerDateValue } from '@/shared/ui/DatePickerMenu.utils.js';
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

function priorityConfig(priority: TaskPriority) {
  return TASK_PRIORITY_META[priority] ?? TASK_PRIORITY_META.none;
}

function PriorityChip({ priority }: { priority: TaskPriority }) {
  const { color, label } = priorityConfig(priority);
  return (
    <span className="tasks-priority-chip" style={{ color }}>
      {label}
    </span>
  );
}

function toInputDate(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function dateFromValue(value?: string | null) {
  const raw = toInputDate(value);
  if (!raw) return null;
  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDueDateValue(date: Date) {
  return `${toPickerDateValue(date)}T00:00:00Z`;
}

function formatShortDate(value?: string | null) {
  const date = dateFromValue(value);
  if (!date) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(firstName?: string, lastName?: string) {
  return [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
}

interface EditableTitleProps {
  task: TaskDTO;
  canEdit: boolean;
  onCommit: (id: string, title: string) => void;
}

function EditableTitle({ task, canEdit, onCommit }: EditableTitleProps) {
  const commit = (value: string, input: HTMLInputElement) => {
    const trimmed = value.trim();
    if (!trimmed) {
      input.value = task.task;
      return;
    }
    if (trimmed !== task.task) onCommit(task.id, trimmed);
  };

  if (!canEdit) {
    return <span className="tasks-table-title">{task.task}</span>;
  }

  return (
    <input
      key={`${task.id}:${task.task}`}
      defaultValue={task.task}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => commit(event.currentTarget.value, event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === 'Escape') {
          event.currentTarget.value = task.task;
          event.currentTarget.blur();
        }
      }}
      className="tasks-title-input"
      aria-label="Task title"
    />
  );
}

interface DueDateMenuProps {
  value?: string | null;
  canEdit: boolean;
  onChange: (dueDate: string | null) => void;
}

function DueDateMenu({ value, canEdit, onChange }: DueDateMenuProps) {
  if (!canEdit) {
    return <span>{formatShortDate(value)}</span>;
  }

  return (
    <DatePickerMenu
      value={value}
      className="tasks-date-trigger"
      align="end"
      iconSize={12}
      ariaLabel="Task due date"
      formatValue={formatShortDate}
      serializeDate={toDueDateValue}
      onChange={onChange}
    />
  );
}

interface PriorityMenuProps {
  priority: TaskPriority;
  canEdit: boolean;
  onChange: (priority: TaskPriority) => void;
}

function PriorityMenu({ priority, canEdit, onChange }: PriorityMenuProps) {
  const selected = priorityConfig(priority);

  if (!canEdit) return <PriorityChip priority={priority} />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="tasks-inline-trigger" style={{ color: selected.color }}>
          <span className="tasks-inline-dot" style={{ background: selected.color }} />
          {selected.label}
          <ChevronDown size={12} className="tasks-inline-chevron" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="glass-menu tasks-inline-menu rounded-xl p-1">
        {TASK_PRIORITIES.map((priorityValue) => {
          const option = TASK_PRIORITY_META[priorityValue];
          return (
            <DropdownMenuItem
              key={priorityValue}
              onSelect={() => onChange(priorityValue)}
              className="glass-menu-item tasks-inline-menu-item"
            >
              <span className="tasks-inline-dot" style={{ background: option.color }} />
              <span style={{ color: option.color }}>{option.label}</span>
              {priorityValue === priority && <Check size={13} className="ml-auto text-[color:var(--sx-text-muted)]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface AssigneeMenuProps {
  task: TaskDTO;
  members: WorkspaceMemberDTO[];
  canEdit: boolean;
  onToggle: (id: string, userId: string) => void;
}

function AssigneeMenu({ task, members, canEdit, onToggle }: AssigneeMenuProps) {
  const assignees = task.assignees ?? [];
  const selectedIds = new Set(assignees.map((assignee) => assignee.id));

  const content = assignees.length > 0 ? (
    <>
      {assignees.slice(0, 3).map((a, i) => {
        const src = a.photo_url ?? a.avatar_url ?? undefined;
        const ini = initials(a.firstName, a.lastName);
        return (
          <div
            key={a.id}
            className="tasks-assignee-avatar"
            style={{ zIndex: 10 - i, marginLeft: i > 0 ? -4 : 0 }}
          >
            {src ? <img src={src} alt={ini} /> : ini}
          </div>
        );
      })}
      {assignees.length > 3 && <span className="tasks-more-chip">+{assignees.length - 3}</span>}
    </>
  ) : (
    <span className="tasks-empty-cell">No one</span>
  );

  if (!canEdit) return <>{content}</>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="tasks-assignee-trigger">
          {content}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="glass-menu min-w-[220px] max-h-72 rounded-xl p-1">
        {members.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[color:var(--sx-text-subtle)]">No members loaded</p>
        ) : (
          members.map((member) => {
            const active = selectedIds.has(member.user.id);
            const src = member.user.photo_url ?? member.user.avatar_url ?? undefined;
            const ini = initials(member.user.firstName, member.user.lastName);
            return (
              <DropdownMenuCheckboxItem
                key={member.user.id}
                checked={active}
                onSelect={(event) => {
                  event.preventDefault();
                  onToggle(task.id, member.user.id);
                }}
                className="glass-menu-item tasks-inline-menu-item"
              >
                <span className="tasks-assignee-avatar">
                  {src ? <img src={src} alt={ini} /> : ini}
                </span>
                <span className={active ? 'text-[color:var(--sx-text)]' : 'text-[color:var(--sx-text-muted)]'}>
                  {member.user.firstName} {member.user.lastName}
                </span>
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TaskRowProps {
  task: TaskDTO;
  workspaceId: string;
  members: WorkspaceMemberDTO[];
  canEdit: boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onTitleChange: (id: string, title: string) => void;
  onPriorityChange: (id: string, priority: TaskPriority) => void;
  onLabelsChange: (id: string, labels: TaskLabelDTO[]) => void;
  onAssigneeToggle: (id: string, userId: string) => void;
  onDueDateChange: (id: string, dueDate: string | null) => void;
  onClick: (id: string) => void;
}

export function TaskRow({
  task,
  workspaceId,
  members,
  canEdit,
  onStatusChange,
  onTitleChange,
  onPriorityChange,
  onLabelsChange,
  onAssigneeToggle,
  onDueDateChange,
  onClick,
}: TaskRowProps) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <div
      onMouseEnter={preloadTaskDetailShell}
      onFocus={preloadTaskDetailShell}
      onClick={() => onClick(task.id)}
      className="tasks-table-row group"
    >
      <div className="tasks-table-status" onClick={(e) => e.stopPropagation()}>
        <StatusMenu
          taskId={task.id}
          status={task.status}
          canEdit={canEdit}
          onStatusChange={(s) => onStatusChange(task.id, s)}
        />
      </div>
      <span className="tasks-table-key">
        {task.key ?? '—'}
      </span>
      <EditableTitle task={task} canEdit={canEdit} onCommit={onTitleChange} />
      <span className="tasks-table-priority" onClick={(e) => e.stopPropagation()}>
        <PriorityMenu
          priority={task.priority}
          canEdit={canEdit}
          onChange={(priority) => onPriorityChange(task.id, priority)}
        />
      </span>
      <div className="tasks-table-labels" onClick={(e) => e.stopPropagation()}>
        <LabelPicker
          workspaceId={workspaceId}
          selected={task.labels ?? []}
          onChange={(labels) => onLabelsChange(task.id, labels)}
          disabled={!canEdit}
          contentAlign="end"
          label={task.labels && task.labels.length > 0 ? task.labels.slice(0, 2).map((label) => label.name).join(', ') : 'No labels'}
          triggerClassName="tasks-label-trigger"
        />
      </div>
      <div className="tasks-table-assignees" onClick={(e) => e.stopPropagation()}>
        <AssigneeMenu
          task={task}
          members={members}
          canEdit={canEdit}
          onToggle={onAssigneeToggle}
        />
      </div>
      <span className={`tasks-table-due ${isOverdue ? 'is-overdue' : ''}`} onClick={(e) => e.stopPropagation()}>
        <DueDateMenu
          value={task.due_date}
          canEdit={canEdit}
          onChange={(dueDate) => onDueDateChange(task.id, dueDate)}
        />
      </span>
    </div>
  );
}
