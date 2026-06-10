import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layers, Plus } from 'lucide-react';
import type { ProjectDTO, UserDTO } from '@/types/dto.js';
import { listVariants } from '@/shared/lib/animations.js';
import { CreateProjectModal } from './CreateProjectModal.js';
import { ProjectRow } from './projects/ProjectRow.js';
import { PROJECT_LIST_ICON_STROKE } from './projects/projectListUtils.js';

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
            <Layers size={13} strokeWidth={PROJECT_LIST_ICON_STROKE} />
            All projects
          </span>
          <button onClick={onCreateOpen} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm">
            <Plus size={13} strokeWidth={PROJECT_LIST_ICON_STROKE} />
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
            <Layers size={20} strokeWidth={PROJECT_LIST_ICON_STROKE} />
          </div>
          <p className="text-body-md font-medium text-[color:var(--sx-text-muted)] mb-1">No projects yet</p>
          <p className="text-label-sm text-[color:var(--sx-text-subtle)] mb-5">Create your first project to get started</p>
          <button onClick={onCreateOpen} className="liquid-button gap-1.5 !bg-[color:var(--starlex-accent)] !border-transparent !text-[color:var(--starlex-accent-contrast)]">
            <Plus size={14} strokeWidth={PROJECT_LIST_ICON_STROKE} />
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
