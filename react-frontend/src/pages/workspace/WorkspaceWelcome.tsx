import React from 'react';
import { Plus, FolderKanban } from 'lucide-react';

interface WorkspaceWelcomeProps {
  firstName: string;
  onCreateTask: () => void;
  onCreateProject: () => void;
}

export const WorkspaceWelcome: React.FC<WorkspaceWelcomeProps> = ({
  firstName,
  onCreateTask,
  onCreateProject,
}) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div>
        <h1 className="text-headline-xl font-hanken font-bold text-white leading-none mb-2">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-body-lg text-white/50">
          Here's what's happening in your workspace.
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onCreateTask}
          className="liquid-button gap-2"
        >
          <Plus size={15} />
          Create Task
        </button>
        <button
          onClick={onCreateProject}
          className="liquid-button gap-2 !bg-[--accent] !border-transparent !text-white"
          style={{ boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}
        >
          <FolderKanban size={15} />
          Create Project
        </button>
      </div>
    </div>
  );
};
