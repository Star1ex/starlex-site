import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  MoreHorizontal,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_META,
  PROJECT_STATUSES,
  PROJECT_STATUS_META,
} from '@/entities/project/model/projectMeta.js';
import { projectService } from '@/services/api/index.js';
import { showToast } from '@/shared/lib/toast.js';
import { listItemVariants } from '@/shared/lib/animations.js';
import Avatar from '@/shared/ui/Avatar.js';
import type { ProjectDTO, ProjectPriority, ProjectStatus, UserDTO } from '@/types/dto.js';
import { ProjectPriorityBars } from './ProjectPriorityBars.js';
import {
  formatProjectTargetDate,
  getProjectGlyph,
  getProjectMemberName,
  PROJECT_LIST_ICON_STROKE,
  toProjectTargetInputDate,
} from './projectListUtils.js';

interface ProjectRowProps {
  project: ProjectDTO;
  members: UserDTO[];
  lead?: UserDTO;
  onProjectUpdated: (project: ProjectDTO) => void;
  onDelete: (id: string) => void;
  onClick: () => void;
}

export function ProjectRow({ project, members, lead, onProjectUpdated, onDelete, onClick }: ProjectRowProps) {
  const [menuOpen, setMenuOpen] = useState<'actions' | 'status' | 'priority' | 'lead' | null>(null);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.backlog;
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
      projectService.setProjectStatus(project.id, statusValue),
    );
  };

  const handlePriorityChange = (priority: ProjectPriority) => {
    if (priority === project.priority) {
      setMenuOpen(null);
      return;
    }
    void updateProject(
      { ...project, priority },
      projectService.setProjectPriority(project.id, priority),
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
          <ProjectPriorityBars priority={project.priority} showLabel />
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
              {PROJECT_PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handlePriorityChange(priority);
                  }}
                  className="dropdown-menu-item"
                >
                  <ProjectPriorityBars priority={priority} />
                  {PROJECT_PRIORITY_META[priority].label}
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
            <UserRound size={14} strokeWidth={PROJECT_LIST_ICON_STROKE} />
          )}
          <span>{getProjectMemberName(lead)}</span>
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
                  {getProjectMemberName(member)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <label className="project-cell project-date-control" onClick={(event) => event.stopPropagation()}>
        <CalendarDays size={14} strokeWidth={PROJECT_LIST_ICON_STROKE} />
        <span>{formatProjectTargetDate(project.deadline)}</span>
        <input
          type="date"
          value={toProjectTargetInputDate(project.deadline)}
          disabled={saving}
          onChange={(event) => handleDeadlineChange(event.target.value)}
          aria-label="Project target date"
        />
      </label>

      <div className="project-cell">
        <UsersRound size={14} strokeWidth={PROJECT_LIST_ICON_STROKE} />
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
              {PROJECT_STATUSES.map((statusValue) => {
                const item = PROJECT_STATUS_META[statusValue];
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
          <MoreHorizontal size={15} strokeWidth={PROJECT_LIST_ICON_STROKE} />
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
                <Trash2 size={14} strokeWidth={PROJECT_LIST_ICON_STROKE} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
