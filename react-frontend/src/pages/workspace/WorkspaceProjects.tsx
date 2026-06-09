import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CircleDashed,
  Layers,
  MoreHorizontal,
  Plus,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import type { ProjectDTO, ProjectPriority, ProjectStatus, UserDTO } from '@/types/dto.js';
import { listItemVariants, listVariants } from '@/shared/lib/animations.js';
import Avatar from '@/shared/ui/Avatar.js';
import { projectService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import { CreateProjectModal } from './CreateProjectModal.js';

const ICON_STROKE = 1.55;

const STATUS_META: Record<ProjectStatus, { label: string; dot: string; progress: number }> = {
  backlog:     { label: 'Backlog',     dot: '#64748b', progress: 0 },
  planned:     { label: 'Planned',     dot: '#a78bfa', progress: 20 },
  in_progress: { label: 'In Progress', dot: '#38bdf8', progress: 55 },
  paused:      { label: 'Paused',      dot: '#f59e0b', progress: 35 },
  completed:   { label: 'Completed',   dot: '#34d399', progress: 100 },
  cancelled:   { label: 'Cancelled',   dot: '#f87171', progress: 0 },
};

const ALL_STATUSES = Object.keys(STATUS_META) as ProjectStatus[];

const PRIORITY_META: Record<ProjectPriority, { label: string; bars: number; color: string }> = {
  none:   { label: 'No priority', bars: 0, color: 'rgba(255,255,255,0.24)' },
  low:    { label: 'Low',         bars: 1, color: '#60a5fa' },
  medium: { label: 'Medium',      bars: 2, color: '#a78bfa' },
  high:   { label: 'High',        bars: 3, color: '#fb923c' },
  urgent: { label: 'Urgent',      bars: 4, color: '#f87171' },
};

const ALL_PRIORITIES = Object.keys(PRIORITY_META) as ProjectPriority[];

function formatDate(value: string | null): string {
  if (!value) return 'No target';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No target';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toInputDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getMemberName(member?: UserDTO): string {
  if (!member) return 'No lead';
  return `${member.firstName || ''}${member.lastName ? ` ${member.lastName}` : ''}`.trim() || member.email;
}

function getProjectGlyph(project: ProjectDTO) {
  if (project.icon) return project.icon;
  return project.name.trim().charAt(0).toUpperCase() || 'P';
}

function PriorityBars({ priority }: { priority: ProjectPriority }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.none;
  return (
    <span className="project-priority" title={meta.label}>
      {Array.from({ length: 4 }).map((_, idx) => (
        <span
          key={idx}
          className="project-priority__bar"
          data-active={idx < meta.bars}
          style={{ ['--priority-color' as string]: meta.color }}
        />
      ))}
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}

interface ProjectRowProps {
  project: ProjectDTO;
  members: UserDTO[];
  lead?: UserDTO;
  onProjectUpdated: (project: ProjectDTO) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

function ProjectRow({ project, members, lead, onProjectUpdated, onDelete, onClick }: ProjectRowProps) {
  const [menuOpen, setMenuOpen] = useState<'actions' | 'status' | 'priority' | 'lead' | null>(null);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = STATUS_META[project.status] ?? STATUS_META.backlog;
  const membersCount = project.member_ids.length;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const updateProject = async (next: ProjectDTO, request: Promise<ProjectDTO>) => {
    const previous = project;
    setSaving(true);
    onProjectUpdated(next);
    try {
      const updated = await request;
      onProjectUpdated(updated);
    } catch {
      onProjectUpdated(previous);
      showToast('Failed to update project');
    } finally {
      setSaving(false);
      setMenuOpen(null);
    }
  };

  const handleStatusChange = (statusValue: ProjectStatus) => {
    if (statusValue === project.status) {
      setMenuOpen(null);
      return;
    }
    void updateProject(
      { ...project, status: statusValue },
      projectService.updateProjectStatus(project.id, statusValue),
    );
  };

  const handlePriorityChange = (priority: ProjectPriority) => {
    if (priority === project.priority) {
      setMenuOpen(null);
      return;
    }
    void updateProject(
      { ...project, priority },
      projectService.updateProjectPriority(project.id, priority),
    );
  };

  const handleLeadChange = (leaderId: string) => {
    if (leaderId === project.leader_id) {
      setMenuOpen(null);
      return;
    }
    void updateProject(
      { ...project, leader_id: leaderId },
      projectService.updateProject(project.id, { leader_id: leaderId }),
    );
  };

  const handleDeadlineChange = (value: string) => {
    const nextDeadline = value ? new Date(`${value}T12:00:00`).toISOString() : null;
    if (nextDeadline === project.deadline) return;
    void updateProject(
      { ...project, deadline: nextDeadline },
      projectService.updateProject(project.id, value ? { deadline: nextDeadline } : { clear_deadline: true }),
    );
  };

  return (
    <motion.div
      ref={menuRef}
      variants={listItemVariants}
      className="projects-list-row group"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.998 }}
    >
      <div className="projects-list-name">
        <div className="project-row-glyph">
          {getProjectGlyph(project)}
        </div>
        <div className="min-w-0">
          <div className="project-row-title">{project.name}</div>
          {project.description && (
            <div className="project-row-description">{project.description}</div>
          )}
        </div>
      </div>

      <div className="project-cell project-health">
        <CircleDashed size={14} strokeWidth={ICON_STROKE} />
        <span>No updates</span>
      </div>

      <div className="project-cell project-inline-menu">
        <button
          type="button"
          className="project-inline-button"
          disabled={saving}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => open === 'priority' ? null : 'priority');
          }}
        >
          <PriorityBars priority={project.priority} />
        </button>
        <AnimatePresence>
          {menuOpen === 'priority' && (
            <motion.div
              className="dropdown-menu project-inline-dropdown"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {ALL_PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePriorityChange(priority);
                  }}
                  className="dropdown-menu-item"
                >
                  <PriorityBars priority={priority} />
                  {PRIORITY_META[priority].label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="project-cell project-lead project-inline-menu">
        <button
          type="button"
          className="project-inline-button project-lead-button"
          disabled={saving}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => open === 'lead' ? null : 'lead');
          }}
        >
          {lead ? (
            <Avatar user={lead} size="xs" className="project-lead-avatar" />
          ) : (
            <UserRound size={14} strokeWidth={ICON_STROKE} />
          )}
          <span>{getMemberName(lead)}</span>
        </button>
        <AnimatePresence>
          {menuOpen === 'lead' && (
            <motion.div
              className="dropdown-menu project-inline-dropdown project-inline-dropdown--wide"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleLeadChange(member.id);
                  }}
                  className="dropdown-menu-item"
                >
                  <Avatar user={member} size="xs" className="project-lead-avatar" />
                  {getMemberName(member)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <label className="project-cell project-date-control" onClick={(event) => event.stopPropagation()}>
        <CalendarDays size={14} strokeWidth={ICON_STROKE} />
        <span>{formatDate(project.deadline)}</span>
        <input
          type="date"
          value={toInputDate(project.deadline)}
          disabled={saving}
          onChange={(event) => handleDeadlineChange(event.target.value)}
          aria-label="Project target date"
        />
      </label>

      <div className="project-cell">
        <UsersRound size={14} strokeWidth={ICON_STROKE} />
        <span>{membersCount || '-'}</span>
      </div>

      <div className="project-cell project-status-cell project-inline-menu">
        <button
          type="button"
          className="project-inline-button project-status-button"
          disabled={saving}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => open === 'status' ? null : 'status');
          }}
        >
          <span className="project-status-dot" style={{ background: status.dot }} />
          <span>{status.label}</span>
        </button>
        <AnimatePresence>
          {menuOpen === 'status' && (
            <motion.div
              className="dropdown-menu project-inline-dropdown project-inline-dropdown--wide"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              {ALL_STATUSES.map((statusValue) => {
                const item = STATUS_META[statusValue];
                return (
                  <button
                    key={statusValue}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleStatusChange(statusValue);
                    }}
                    className="dropdown-menu-item"
                  >
                    <span className="project-status-dot" style={{ background: item.dot }} />
                    {item.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="project-progress-cell">
        <span>{status.progress}%</span>
        <div className="project-row-progress">
          <div style={{ width: `${status.progress}%`, background: status.dot }} />
        </div>
      </div>

      <div className="project-row-menu">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => open === 'actions' ? null : 'actions');
          }}
          className="project-row-menu-button"
          aria-label="Project actions"
        >
          <MoreHorizontal size={15} strokeWidth={ICON_STROKE} />
        </button>
        <AnimatePresence>
          {menuOpen === 'actions' && (
            <motion.div
              className="dropdown-menu absolute right-0 top-8 z-30 min-w-[140px]"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.12 }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(project.id);
                  setMenuOpen(null);
                }}
                className="dropdown-menu-item !text-[#fca5a5] hover:!bg-[rgba(239,68,68,0.12)]"
              >
                <Trash2 size={14} strokeWidth={ICON_STROKE} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface WorkspaceProjectsProps {
  workspaceId: string;
  projects: ProjectDTO[];
  members: UserDTO[];
  onProjectCreated: (p: ProjectDTO) => void;
  onProjectUpdated: (p: ProjectDTO) => void;
  onProjectDeleted: (id: string) => void;
  onProjectClick: (id: string) => void;
  onCreateOpen: () => void;
  showCreate: boolean;
  onCreateClose: () => void;
}

export const WorkspaceProjects: React.FC<WorkspaceProjectsProps> = ({
  workspaceId,
  projects,
  members,
  onProjectCreated,
  onProjectUpdated,
  onProjectDeleted,
  onProjectClick,
  onCreateOpen,
  showCreate,
  onCreateClose,
}) => {
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  return (
    <section>
      <div className="projects-list-toolbar">
        <div>
          <h2 className="projects-list-heading">Projects</h2>
          <p className="projects-list-subtitle">{projects.length} project{projects.length === 1 ? '' : 's'} in this workspace</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="projects-view-pill">
            <Layers size={13} strokeWidth={ICON_STROKE} />
            All projects
          </span>
          <button onClick={onCreateOpen} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm">
            <Plus size={13} strokeWidth={ICON_STROKE} />
            New Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="projects-empty-state"
        >
          <div className="projects-empty-icon">
            <Layers size={20} strokeWidth={ICON_STROKE} />
          </div>
          <p className="text-body-md font-medium text-white/60 mb-1">No projects yet</p>
          <p className="text-label-sm text-white/30 mb-5">Create your first project to get started</p>
          <button onClick={onCreateOpen} className="liquid-button gap-1.5 !bg-[--accent] !border-transparent !text-white">
            <Plus size={14} strokeWidth={ICON_STROKE} />
            Create Project
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="projects-list-shell"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          <div className="projects-list-header">
            <span>Name</span>
            <span>Health</span>
            <span>Priority</span>
            <span>Lead</span>
            <span>Target</span>
            <span>Team</span>
            <span>Status</span>
            <span>Progress</span>
            <span />
          </div>

          {projects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              members={members}
              lead={memberById.get(project.leader_id)}
              onProjectUpdated={onProjectUpdated}
              onDelete={onProjectDeleted}
              onClick={() => onProjectClick(project.id)}
            />
          ))}
        </motion.div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={onCreateClose}
        onCreated={onProjectCreated}
        workspaceId={workspaceId}
      />
    </section>
  );
};
