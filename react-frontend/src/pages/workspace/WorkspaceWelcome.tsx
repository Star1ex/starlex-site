import React from 'react';
import { Plus, Kanban as ProjectsIcon } from 'lucide-react';

interface WorkspaceWelcomeProps {
  workspaceName: string;
  firstName: string;
  onCreateTask: () => void;
  onCreateProject: () => void;
}

export const WorkspaceWelcome: React.FC<WorkspaceWelcomeProps> = ({
  workspaceName,
  firstName,
  onCreateTask,
  onCreateProject,
}) => {
  return (
    <div className="workspace-home-header">
      <div>
        <p className="label-caps text-[color:var(--sx-text-subtle)]">Workspace</p>
        <h1>{workspaceName}</h1>
        <p>{firstName ? `${firstName}, here is the current execution snapshot.` : 'Current execution snapshot.'}</p>
      </div>
      <div className="workspace-home-actions">
        <button
          onClick={onCreateTask}
          className="liquid-button gap-2"
        >
          <Plus size={15} />
          Create Task
        </button>
        <button
          onClick={onCreateProject}
          className="liquid-button gap-2 !bg-[color:var(--starlex-accent)] !border-transparent !text-[color:var(--starlex-accent-contrast)]"
        >
          <ProjectsIcon size={15} />
          Create Project
        </button>
      </div>
    </div>
  );
};
