import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock3, Layers, Plus } from 'lucide-react';
import type { ProjectDTO } from '@/types/dto.js';
import { listItemVariants, listVariants } from '@/shared/lib/animations.js';
import { Glass } from '@/shared/ui/glass/index.js';
import { PROJECT_STATUS_META } from '@/entities/project/model/projectMeta.js';

interface WorkspaceBentoProps {
  workspaceId: string;
  projects: ProjectDTO[];
  onCreateProject: () => void;
}

function projectInitial(project: ProjectDTO) {
  return (project.icon || project.name || 'P').trim().charAt(0).toUpperCase() || 'P';
}

function updatedLabel(value?: string): string {
  if (!value) return 'Recently updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return `Updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export const WorkspaceBento: React.FC<WorkspaceBentoProps> = ({
  workspaceId,
  projects,
  onCreateProject,
}) => {
  const navigate = useNavigate();
  const recentProjects = useMemo(() => (
    [...projects]
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 6)
  ), [projects]);

  return (
    <Glass
      as={motion.section}
      variant="panel"
      depth="raised"
      className="workspace-recent-panel"
      variants={listVariants}
      initial="initial"
      animate="animate"
    >
      <div className="workspace-recent-head">
        <div>
          <p className="label-caps text-[color:var(--sx-text-subtle)]">Recent</p>
          <h2>Projects</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/workspace/${workspaceId}?view=projects`)}
        >
          View all
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="workspace-recent-list">
        {recentProjects.map((project) => {
          const meta = PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.backlog;
          return (
            <motion.button
              key={project.id}
              type="button"
              variants={listItemVariants}
              onClick={() => navigate(`/workspace/${workspaceId}/projects/${project.id}`)}
              className="workspace-recent-project"
            >
              <span className="workspace-recent-glyph">{projectInitial(project)}</span>
              <span className="workspace-recent-main">
                <strong>{project.name}</strong>
                <em>
                  <Clock3 size={12} />
                  {updatedLabel(project.updated_at || project.created_at)}
                </em>
              </span>
              <span className="workspace-recent-status">
                <i style={{ background: meta.dot }} />
                {meta.label}
              </span>
            </motion.button>
          );
        })}

        {recentProjects.length === 0 && (
          <motion.div variants={listItemVariants} className="workspace-recent-empty">
            <div>
              <Layers size={17} />
            </div>
            <p>No projects yet</p>
            <span>Create a project to start organizing work.</span>
          </motion.div>
        )}
      </div>

      <motion.button
        type="button"
        variants={listItemVariants}
        onClick={onCreateProject}
        className="workspace-recent-create"
      >
        <Plus size={14} />
        New project
      </motion.button>
    </Glass>
  );
};
