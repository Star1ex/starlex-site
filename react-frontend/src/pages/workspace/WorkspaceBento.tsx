import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ArrowRight } from 'lucide-react';
import type { ProjectDTO, UserDTO } from '@/types/dto.js';

interface WorkspaceBentoProps {
  workspaceId: string;
  projects: ProjectDTO[];
  members: UserDTO[];
  onNewWorkspace: () => void;
}

function ActiveProjectCard({ project, workspaceId }: { project: ProjectDTO; workspaceId: string }) {
  const navigate = useNavigate();
  const progress = project.status === 'completed' ? 100 : project.status === 'in_progress' ? 55 : 20;

  return (
    <div
      className="glass-card rounded-2xl p-6 col-span-12 lg:col-span-8 flex flex-col gap-5 cursor-pointer hover:border-white/15 transition-all"
      onClick={() => navigate(`/workspace/${workspaceId}/projects/${project.id}`)}
    >
      <div>
        <p className="label-caps text-white/40 mb-2">Active Project</p>
        <h3 className="text-headline-md font-hanken font-semibold text-white">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-body-md text-white/50 mt-1.5 line-clamp-2">{project.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 mt-auto">
        {/* Members avatars */}
        {project.member_ids.length > 0 && (
          <div className="flex items-center -space-x-2">
            {project.member_ids.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-black bg-white/10"
                style={{ zIndex: 5 - i }}
              />
            ))}
            {project.member_ids.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] text-white/60 font-mono">
                +{project.member_ids.length - 5}
              </div>
            )}
          </div>
        )}
        {/* Progress */}
        <div className="flex-1 max-w-[200px]">
          <div className="flex justify-between text-label-sm text-white/40 mb-1.5">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progress}%`, background: 'var(--accent, #6366f1)' }} />
          </div>
        </div>
        <ArrowRight size={16} className="text-white/30 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}

function MembersCard({ members, workspaceId }: { members: UserDTO[]; workspaceId: string }) {
  const navigate = useNavigate();
  return (
    <div
      className="glass-card rounded-2xl p-6 col-span-12 lg:col-span-4 flex flex-col gap-4 cursor-pointer hover:border-white/15 transition-all"
      onClick={() => navigate(`/workspace/${workspaceId}?view=members`)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="label-caps text-white/40 mb-1.5">Team</p>
          <p className="text-headline-md font-hanken font-bold text-white">{members.length}</p>
          <p className="text-label-sm text-white/40">member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <Users size={20} className="text-white/20" />
      </div>
      <div className="flex items-center -space-x-2 mt-auto">
        {members.slice(0, 7).map((m, i) => (
          m.photo_url || m.avatar_url ? (
            <img
              key={m.id}
              src={(m.photo_url || m.avatar_url)!}
              className="w-8 h-8 rounded-full border-2 border-black object-cover"
              style={{ zIndex: 7 - i }}
              alt={m.firstName}
            />
          ) : (
            <div
              key={m.id}
              className="w-8 h-8 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60"
              style={{ zIndex: 7 - i }}
            >
              {m.firstName.charAt(0)}
            </div>
          )
        ))}
        {members.length > 7 && (
          <div className="w-8 h-8 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] text-white/50 font-mono">
            +{members.length - 7}
          </div>
        )}
      </div>
    </div>
  );
}

function NewWorkspaceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="col-span-12 lg:col-span-4 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-all duration-200 hover:border-white/20 hover:bg-white/3"
      style={{ border: '1.5px dashed rgba(255,255,255,0.10)' }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Plus size={18} className="text-white/40" />
      </div>
      <p className="text-body-md text-white/40 font-medium">New Workspace</p>
    </button>
  );
}

export const WorkspaceBento: React.FC<WorkspaceBentoProps> = ({
  workspaceId,
  projects,
  members,
  onNewWorkspace,
}) => {
  const activeProject =
    projects.find(p => p.status === 'in_progress') ??
    projects.find(p => p.status === 'planned') ??
    projects[0];

  return (
    <div className="grid grid-cols-12 gap-4">
      {activeProject ? (
        <ActiveProjectCard project={activeProject} workspaceId={workspaceId} />
      ) : (
        <div className="glass-card rounded-2xl p-6 col-span-12 lg:col-span-8 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]"
          style={{ border: '1.5px dashed rgba(255,255,255,0.08)' }}>
          <p className="text-body-md text-white/30">No active project yet</p>
        </div>
      )}

      {members.length > 0 ? (
        <MembersCard members={members} workspaceId={workspaceId} />
      ) : (
        <div className="glass-card rounded-2xl p-6 col-span-12 lg:col-span-4 flex flex-col items-center justify-center text-center min-h-[120px]">
          <Users size={20} className="text-white/20 mb-2" />
          <p className="text-label-sm text-white/30">No members yet</p>
        </div>
      )}

      <NewWorkspaceCard onClick={onNewWorkspace} />
    </div>
  );
};
