import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { workspaceService, projectService, userService } from '@/services/api/index.js';
import type { ProjectDTO, UserDTO, UserProfileDTO, WorkspaceDTO } from '@/types/dto.js';
import { pageVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { showToast } from '@/shared/lib/toast.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { WorkspaceWelcome } from './WorkspaceWelcome.js';
import { WorkspaceBento } from './WorkspaceBento.js';
import { WorkspaceProjects } from './WorkspaceProjects.js';

// ─── loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-12 w-72 rounded-xl bg-white/5" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 h-44 rounded-2xl bg-white/5" />
        <div className="col-span-4 h-44 rounded-2xl bg-white/5" />
      </div>
      <div className="h-px bg-white/5" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl bg-white/5" />)}
      </div>
    </div>
  );
}

// ─── members panel ─────────────────────────────────────────────────────────────

function MembersPanel({ members, workspaceId }: { members: UserDTO[]; workspaceId: string }) {
  const navigate = useNavigate();
  if (members.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="h-px bg-white/5 mb-8" />
      <h2 className="label-caps text-white/40 mb-4">Members</h2>
      <div className="flex flex-wrap gap-2">
        {members.map(m => (
          <button
            key={m.id}
            onClick={() => navigate(`/profile/${m.id}`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm text-white/70 bg-white/5 border border-transparent hover:border-white/12 hover:text-white/90 transition-all"
          >
            {m.photo_url || m.avatar_url ? (
              <img src={(m.photo_url || m.avatar_url)!} className="w-5 h-5 rounded-full object-cover" alt="" />
            ) : (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-white/10 text-white/50">
                {m.firstName.charAt(0)}
              </span>
            )}
            {m.firstName} {m.lastName}
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { setActiveWorkspace } = useWorkspace();

  const [workspace, setWorkspace] = useState<WorkspaceDTO | null>(null);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [members, setMembers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfileDTO | null>(null);

  useDocumentTitle(workspace?.name ?? 'Workspace');

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [ps, ms, wsList, profile] = await Promise.all([
        projectService.getWorkspaceProjects(workspaceId),
        workspaceService.getWorkspaceUsers(workspaceId),
        userService.getWorkspaces(),
        userService.getProfile().catch(() => null),
      ]);
      setProjects(ps);
      setMembers(ms);
      const ws = wsList.find(w => w.id === workspaceId) ?? null;
      setWorkspace(ws);
      if (ws) setActiveWorkspace(ws);
      if (profile) setCurrentUser(profile);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) navigate('/sign-in');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, navigate, setActiveWorkspace]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!workspaceId || !workspace) return;
    trackItem({ id: workspaceId, name: workspace.name, url: `/workspace/${workspaceId}`, type: 'workspace' });
  }, [workspaceId, workspace]);

  const handleNewWorkspace = useCallback(() => {
    navigate('/onboarding');
  }, [navigate]);

  const handleProjectCreated = useCallback((p: ProjectDTO) => {
    setProjects(prev => [p, ...prev]);
    setShowCreate(false);
    navigate(`/workspace/${workspaceId}/projects/${p.id}`);
  }, [workspaceId, navigate]);

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const snapshot = projects;
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      await projectService.deleteProject(id);
    } catch {
      setProjects(snapshot);
      showToast('Failed to delete project.');
    }
  }, [projects]);

  if (loading) {
    return (
      <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <PageSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pb-16 space-y-10"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <WorkspaceWelcome
        firstName={currentUser?.firstName ?? ''}
        onCreateTask={() => navigate(`/task/new?workspaceId=${workspaceId}`)}
        onCreateProject={() => setShowCreate(true)}
      />

      <WorkspaceBento
        workspaceId={workspaceId!}
        projects={projects}
        members={members}
        onNewWorkspace={handleNewWorkspace}
      />

      <div className="h-px bg-white/5" />

      <WorkspaceProjects
        workspaceId={workspaceId!}
        projects={projects}
        onProjectCreated={handleProjectCreated}
        onProjectDeleted={handleDeleteProject}
        onProjectClick={id => navigate(`/workspace/${workspaceId}/projects/${id}`)}
        onCreateOpen={() => setShowCreate(true)}
        showCreate={showCreate}
        onCreateClose={() => setShowCreate(false)}
      />

      <MembersPanel members={members} workspaceId={workspaceId!} />
    </motion.div>
  );
};

export default WorkspacePage;
