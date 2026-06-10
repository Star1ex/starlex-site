import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Circle,
  Crown,
  Layers,
  Trash2,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.js';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog.js';
import RichEditor from '@/features/markdown/LazyRichEditor.js';
import Avatar from '@/shared/ui/Avatar.js';
import { projectService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import { can } from '@/shared/lib/permissions.js';
import {
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_META,
  PROJECT_STATUSES,
  PROJECT_STATUS_META,
} from '@/entities/project/model/projectMeta.js';
import type { ProjectDTO, ProjectPriority, ProjectStatus, UserDTO, WorkspaceRole } from '@/types/dto.js';

const NO_LEAD_VALUE = '__no_lead__';

function dueDateValue(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function dueDateLabel(value: string | null): string {
  if (!value) return 'No target';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No target';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function memberName(member?: UserDTO): string {
  if (!member) return 'No lead';
  return `${member.firstName || ''}${member.lastName ? ` ${member.lastName}` : ''}`.trim() || member.email;
}

function projectInitial(project: ProjectDTO, fallbackName?: string): string {
  const source = (project.icon || fallbackName || project.name || 'P').trim();
  return source.charAt(0).toUpperCase() || 'P';
}

function projectProgress(tasks: { status?: string }[]) {
  if (tasks.length === 0) return { done: 0, inProgress: 0, pct: 0 };
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length;
  return { done, inProgress, pct: Math.round((done / tasks.length) * 100) };
}

interface ProjectHeaderProps {
  project: ProjectDTO;
  tasks: { status?: string }[];
  workspaceRole?: WorkspaceRole;
  currentUserId?: string;
  onBack: () => void;
  onProjectChange?: (updated: ProjectDTO) => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project, tasks, workspaceRole, currentUserId, onBack, onProjectChange,
}) => {
  const isLeader = Boolean(currentUserId && project.leader_id === currentUserId);
  const canManage = can.manageProject(workspaceRole, isLeader);
  const [name, setName] = useState(project.name);
  const [icon, setIcon] = useState(project.icon || '');
  const [description, setDescription] = useState(project.description || '');
  const nameSavedRef = useRef(project.name);
  const iconSavedRef = useRef(project.icon || '');
  const descriptionSavedRef = useRef(project.description || '');
  const progress = projectProgress(tasks);

  useEffect(() => {
    if (!canManage) return;
    const nextName = name.trim();
    if (!nextName || nextName === nameSavedRef.current) return;

    const timeout = window.setTimeout(async () => {
      try {
        const updated = await projectService.updateProject(project.id, { name: nextName });
        nameSavedRef.current = updated.name;
        onProjectChange?.(updated);
      } catch {
        showToast('Failed to update project name');
        setName(nameSavedRef.current);
      }
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [canManage, name, onProjectChange, project.id]);

  useEffect(() => {
    if (!canManage) return;
    const nextIcon = icon.trim();
    if (nextIcon === iconSavedRef.current) return;

    const timeout = window.setTimeout(async () => {
      try {
        const updated = await projectService.updateProject(project.id, { icon: nextIcon });
        iconSavedRef.current = updated.icon || '';
        onProjectChange?.(updated);
      } catch {
        showToast('Failed to update project icon');
        setIcon(iconSavedRef.current);
      }
    }, 550);

    return () => window.clearTimeout(timeout);
  }, [canManage, icon, onProjectChange, project.id]);

  useEffect(() => {
    if (!canManage) return;
    if (description === descriptionSavedRef.current) return;

    const timeout = window.setTimeout(async () => {
      try {
        const updated = await projectService.updateProject(project.id, { description });
        descriptionSavedRef.current = updated.description || '';
        onProjectChange?.(updated);
      } catch {
        showToast('Failed to update project description');
        setDescription(descriptionSavedRef.current);
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [canManage, description, onProjectChange, project.id]);

  return (
    <section className="project-overview-main">
      <button
        onClick={onBack}
        className="project-back-link"
      >
        <ArrowLeft size={13} />
        Back to workspace
      </button>

      <div className="project-title-row">
        <label className="project-icon-editor" aria-label="Project icon">
          {canManage ? (
            <input
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder={projectInitial(project, name)}
              spellCheck={false}
            />
          ) : (
            <span>{project.icon || projectInitial(project, name)}</span>
          )}
        </label>

        {canManage ? (
          <textarea
            value={name}
            onChange={(event) => setName(event.target.value)}
            rows={1}
            spellCheck={false}
            className="project-title-input"
            placeholder="Project name"
          />
        ) : (
          <h1 className="project-title-text">{project.name}</h1>
        )}
      </div>

      <div className="project-overview-meta">
        <span className="project-overview-meta-item">
          <Layers size={13} />
          {tasks.length} issue{tasks.length !== 1 ? 's' : ''}
        </span>
        <span className="project-overview-meta-item">
          <Circle size={12} style={{ color: PROJECT_STATUS_META[project.status]?.dot }} />
          {PROJECT_STATUS_META[project.status]?.label ?? 'Backlog'}
        </span>
        <span className="project-overview-meta-item">
          {progress.pct}% complete
        </span>
      </div>

      <section className="project-description-block">
        <div className="project-section-label">Description</div>
        {canManage ? (
          <RichEditor
            value={description}
            onChange={setDescription}
            placeholder="Add project context, checklist, links, or notes..."
            containerClassName="project-markdown-editor min-h-[260px]"
          />
        ) : (
          <div className="project-readonly-description whitespace-pre-wrap">
            {description || <span>No description</span>}
          </div>
        )}
      </section>
    </section>
  );
};

interface ProjectPropertiesPanelProps {
  project: ProjectDTO;
  members: UserDTO[];
  tasks: { status?: string }[];
  workspaceRole?: WorkspaceRole;
  currentUserId?: string;
  onProjectChange?: (updated: ProjectDTO) => void;
  onProjectDeleted?: () => void;
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="project-property-row">
      <div className="project-property-label">{label}</div>
      <div className="project-property-value">{children}</div>
    </div>
  );
}

export const ProjectPropertiesPanel: React.FC<ProjectPropertiesPanelProps> = ({
  project, members, tasks, workspaceRole, currentUserId, onProjectChange, onProjectDeleted,
}) => {
  const isLeader = Boolean(currentUserId && project.leader_id === currentUserId);
  const canManage = can.manageProject(workspaceRole, isLeader);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const progress = useMemo(() => projectProgress(tasks), [tasks]);
  const statusMeta = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.backlog;
  const priorityMeta = PROJECT_PRIORITY_META[project.priority] ?? PROJECT_PRIORITY_META.none;
  const lead = members.find((member) => member.id === project.leader_id);

  const updateProject = useCallback(async (next: ProjectDTO, request: Promise<ProjectDTO>) => {
    const previous = project;
    onProjectChange?.(next);
    try {
      const updated = await request;
      onProjectChange?.(updated);
    } catch {
      onProjectChange?.(previous);
      showToast('Failed to update project');
    }
  }, [onProjectChange, project]);

  const handleStatusChange = useCallback((status: ProjectStatus) => {
    if (status === project.status) return;
    void updateProject(
      { ...project, status },
      projectService.setProjectStatus(project.id, status),
    );
  }, [project, updateProject]);

  const handlePriorityChange = useCallback((priority: ProjectPriority) => {
    if (priority === project.priority) return;
    void updateProject(
      { ...project, priority },
      projectService.setProjectPriority(project.id, priority),
    );
  }, [project, updateProject]);

  const handleLeadChange = useCallback((value: string) => {
    if (value === NO_LEAD_VALUE || value === project.leader_id) return;
    void updateProject(
      { ...project, leader_id: value },
      projectService.updateProject(project.id, { leader_id: value }),
    );
  }, [project, updateProject]);

  const handleDeadlineChange = useCallback((value: string) => {
    const nextDeadline = value ? new Date(`${value}T12:00:00`).toISOString() : null;
    if (nextDeadline === project.deadline) return;
    void updateProject(
      { ...project, deadline: nextDeadline },
      projectService.updateProject(project.id, value ? { deadline: nextDeadline } : { clear_deadline: true }),
    );
  }, [project, updateProject]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await projectService.deleteProject(project.id);
      onProjectDeleted?.();
    } catch {
      showToast('Failed to delete project');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }, [onProjectDeleted, project.id]);

  return (
    <aside className="project-properties-panel">
      <div className="project-properties-header">
        <div>
          <h2>Properties</h2>
          <p>Project state and ownership</p>
        </div>
        <ChevronDown size={14} />
      </div>

      <PropertyRow label="Status">
        {canManage ? (
          <Select value={project.status} onValueChange={(value) => handleStatusChange(value as ProjectStatus)}>
            <SelectTrigger
              className="project-property-select"
              style={{ ['--pill-color' as string]: statusMeta.dot }}
            >
              <span className="project-header-pill-dot" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="glass-menu project-header-menu z-[80] min-w-[var(--radix-select-trigger-width)] rounded-xl p-1"
            >
              {PROJECT_STATUSES.map((status) => {
                const meta = PROJECT_STATUS_META[status];
                return (
                  <SelectItem
                    key={status}
                    value={status}
                    className="glass-menu-item project-status-select-item text-label-sm focus:text-[color:var(--sx-text)]"
                    style={{ ['--item-dot' as string]: meta.dot }}
                  >
                    {meta.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <span className="project-property-static" style={{ ['--pill-color' as string]: statusMeta.dot }}>
            <span className="project-header-pill-dot" />
            {statusMeta.label}
          </span>
        )}
      </PropertyRow>

      <PropertyRow label="Priority">
        {canManage ? (
          <Select value={project.priority} onValueChange={(value) => handlePriorityChange(value as ProjectPriority)}>
            <SelectTrigger
              className="project-property-select"
              style={{ ['--pill-color' as string]: priorityMeta.color }}
            >
              <span className="project-header-pill-dot" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="glass-menu project-header-menu z-[80] min-w-[var(--radix-select-trigger-width)] rounded-xl p-1"
            >
              {PROJECT_PRIORITIES.map((priority) => (
                <SelectItem
                  key={priority}
                  value={priority}
                  className="glass-menu-item project-priority-select-item text-label-sm focus:text-[color:var(--sx-text)]"
                  style={{ ['--item-dot' as string]: PROJECT_PRIORITY_META[priority].color }}
                >
                  {PROJECT_PRIORITY_META[priority].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="project-property-static" style={{ ['--pill-color' as string]: priorityMeta.color }}>
            <span className="project-header-pill-dot" />
            {priorityMeta.label}
          </span>
        )}
      </PropertyRow>

      <PropertyRow label="Lead">
        {canManage && members.length > 0 ? (
          <Select value={project.leader_id || NO_LEAD_VALUE} onValueChange={handleLeadChange}>
            <SelectTrigger className="project-property-select project-property-select--neutral">
              {lead ? <Avatar user={lead} size="xs" className="project-property-avatar" /> : <Crown size={13} />}
              <SelectValue placeholder="No lead" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="start"
              className="glass-menu project-header-menu z-[80] min-w-[var(--radix-select-trigger-width)] rounded-xl p-1"
            >
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id} className="glass-menu-item text-label-sm focus:text-[color:var(--sx-text)]">
                  {memberName(member)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="project-property-static project-property-static--neutral">
            {lead ? <Avatar user={lead} size="xs" className="project-property-avatar" /> : <Crown size={13} />}
            {memberName(lead)}
          </span>
        )}
      </PropertyRow>

      <PropertyRow label="Target">
        {canManage ? (
          <label className="project-date-field">
            <CalendarDays size={13} />
            <span>{dueDateLabel(project.deadline)}</span>
            <input
              type="date"
              value={dueDateValue(project.deadline)}
              onChange={(event) => handleDeadlineChange(event.target.value)}
              aria-label="Project target date"
            />
          </label>
        ) : (
          <span className="project-property-static project-property-static--neutral">
            <CalendarDays size={13} />
            {dueDateLabel(project.deadline)}
          </span>
        )}
      </PropertyRow>

      <PropertyRow label="Members">
        <div className="project-members-inline">
          {members.slice(0, 5).map((member) => (
            <Avatar key={member.id} user={member} size="xs" className="project-member-avatar" />
          ))}
          <span>{members.length || project.member_ids.length}</span>
        </div>
      </PropertyRow>

      <PropertyRow label="Issues">
        <span className="project-property-static project-property-static--neutral">
          <Layers size={13} />
          {tasks.length}
        </span>
      </PropertyRow>

      <div className="project-progress-panel">
        <div className="project-progress-panel-top">
          <span>Progress</span>
          <strong>{progress.pct}%</strong>
        </div>
        <div className="project-progress-track">
          <div style={{ width: `${progress.pct}%`, background: statusMeta.dot }} />
        </div>
        <p>{progress.done}/{tasks.length} completed</p>
      </div>

      {canManage && (
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="project-delete-action"
        >
          <Trash2 size={13} />
          Delete project
        </button>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-card border-[color:var(--sx-border)] bg-[color:var(--sx-panel)] backdrop-blur-2xl text-[color:var(--sx-text)] sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[color:var(--sx-text)] font-hanken">Delete project</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--sx-text-muted)]">
              Are you sure you want to delete <strong className="text-[color:var(--sx-text)]">{project.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[color:var(--sx-border)] text-[color:var(--sx-text-muted)] hover:bg-[color:var(--sx-control)]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600/80 hover:bg-red-600 text-[color:var(--sx-accent-contrast)] border-0"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
