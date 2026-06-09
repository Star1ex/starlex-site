import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Layers, MoreHorizontal, Trash2, Users } from 'lucide-react';
import type { ProjectDTO } from '@/types/dto.js';
import { listVariants, listItemVariants } from '@/shared/lib/animations.js';
import { CreateProjectModal } from './CreateProjectModal.js';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; pillClass: string }> = {
  backlog:     { label: 'Backlog',      dot: '#475569', pillClass: 'bg-slate-800/60 text-slate-400' },
  planned:     { label: 'Planned',      dot: '#a78bfa', pillClass: 'bg-violet-900/30 text-violet-300' },
  in_progress: { label: 'In Progress',  dot: '#3b82f6', pillClass: 'bg-blue-900/30 text-blue-300' },
  paused:      { label: 'Paused',       dot: '#f59e0b', pillClass: 'bg-amber-900/30 text-amber-300' },
  completed:   { label: 'Completed',    dot: '#22c55e', pillClass: 'bg-green-900/30 text-green-300' },
  cancelled:   { label: 'Cancelled',    dot: '#ef4444', pillClass: 'bg-red-900/30 text-red-400' },
};

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  none:   { label: '',       cls: '' },
  urgent: { label: 'Urgent', cls: 'text-red-400' },
  high:   { label: 'High',   cls: 'text-orange-400' },
  medium: { label: 'Medium', cls: 'text-amber-400' },
  low:    { label: 'Low',    cls: 'text-blue-400' },
};

// ─── project card ──────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectDTO;
  onDelete: (id: string) => void;
  onClick: () => void;
}

function ProjectCard({ project, onDelete, onClick }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sm = STATUS_META[project.status] ?? STATUS_META.backlog;
  const pm = PRIORITY_META[project.priority] ?? PRIORITY_META.none;

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  return (
    <motion.div
      variants={listItemVariants}
      className="group glass-card rounded-xl p-4 cursor-pointer hover:border-white/15 transition-all duration-150 select-none"
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {project.icon ? (
            <span className="text-xl leading-none flex-shrink-0">{project.icon}</span>
          ) : (
            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold bg-white/8 text-white/50">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-body-md text-white truncate">{project.name}</span>
        </div>

        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
            className="w-6 h-6 flex items-center justify-center rounded text-white/30 opacity-0 group-hover:opacity-100 hover:text-white/80 transition-all"
          >
            <MoreHorizontal size={14} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="dropdown-menu absolute right-0 top-7 z-20 min-w-[130px]"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.12 } }}
                exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.08 } }}
              >
                <button
                  onClick={e => { e.stopPropagation(); onDelete(project.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-red-400 hover:bg-red-900/20 transition-colors rounded-lg"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {project.description && (
        <p className="text-label-sm text-white/40 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full font-medium ${sm.pillClass}`}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
          {sm.label}
        </span>
        {project.priority !== 'none' && (
          <span className={`text-label-sm font-medium ${pm.cls}`}>{pm.label}</span>
        )}
        {project.member_ids.length > 0 && (
          <span className="flex items-center gap-0.5 text-label-sm text-white/30 ml-auto">
            <Users size={11} />
            {project.member_ids.length}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── main export ───────────────────────────────────────────────────────────────

interface WorkspaceProjectsProps {
  workspaceId: string;
  projects: ProjectDTO[];
  onProjectCreated: (p: ProjectDTO) => void;
  onProjectDeleted: (id: string) => void;
  onProjectClick: (id: string) => void;
  onCreateOpen: () => void;
  showCreate: boolean;
  onCreateClose: () => void;
}

export const WorkspaceProjects: React.FC<WorkspaceProjectsProps> = ({
  workspaceId,
  projects,
  onProjectCreated,
  onProjectDeleted,
  onProjectClick,
  onCreateOpen,
  showCreate,
  onCreateClose,
}) => (
  <section>
    <div className="flex items-center justify-between mb-5">
      <h2 className="label-caps text-white/40">Projects</h2>
      <button onClick={onCreateOpen} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm">
        <Plus size={13} />
        New Project
      </button>
    </div>

    {projects.length === 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="flex flex-col items-center justify-center py-16 text-center rounded-2xl"
        style={{ border: '1.5px dashed rgba(255,255,255,0.08)' }}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 mb-3">
          <Layers size={20} className="text-white/20" />
        </div>
        <p className="text-body-md font-medium text-white/60 mb-1">No projects yet</p>
        <p className="text-label-sm text-white/30 mb-5">Create your first project to get started</p>
        <button onClick={onCreateOpen} className="liquid-button gap-1.5 !bg-[--accent] !border-transparent !text-white">
          <Plus size={14} />
          Create Project
        </button>
      </motion.div>
    ) : (
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        variants={listVariants}
        initial="initial"
        animate="animate"
      >
        {projects.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            onDelete={onProjectDeleted}
            onClick={() => onProjectClick(p.id)}
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
