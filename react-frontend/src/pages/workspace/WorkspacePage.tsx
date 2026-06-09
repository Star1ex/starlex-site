import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import { CreateProjectModal } from './CreateProjectModal.js';
import { MembersPanel } from '@/features/members/MembersPanel.js';

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

// ─── main page ─────────────────────────────────────────────────────────────────

export const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const view = new URLSearchParams(location.search).get('view');
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

  const handleProjectUpdated = useCallback((updated: ProjectDTO) => {
    setProjects(prev => prev.map(project => project.id === updated.id ? updated : project));
  }, []);

  if (loading) {
    return (
      <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <PageSkeleton />
      </motion.div>
    );
  }

  if (view === 'members') {
    return (
      <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <MembersPanel workspaceId={workspaceId!} currentRole={workspace?.role} />
      </motion.div>
    );
  }

  if (view === 'projects') {
    return (
      <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <WorkspaceProjects
          workspaceId={workspaceId!}
          projects={projects}
          members={members}
          onProjectCreated={handleProjectCreated}
          onProjectUpdated={handleProjectUpdated}
          onProjectDeleted={handleDeleteProject}
          onProjectClick={id => navigate(`/workspace/${workspaceId}/projects/${id}`)}
          onCreateOpen={() => setShowCreate(true)}
          showCreate={showCreate}
          onCreateClose={() => setShowCreate(false)}
        />
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

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleProjectCreated}
        workspaceId={workspaceId!}
      />
    </motion.div>
  );
};

export default WorkspacePage;
