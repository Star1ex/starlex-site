import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { projectService, taskService } from '@/services/api/index.js';
import type { ProjectDTO, TaskDTO, UserDTO } from '@/types/dto.js';
import { pageVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { showToast } from '@/shared/lib/toast.js';
import { ProjectHeader } from './ProjectHeader.js';
import { ProjectTaskList } from './ProjectTaskList.js';

// ─── page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-white/5" />
      <div className="h-9 w-64 rounded-xl bg-white/5" />
      <div className="flex gap-2">
        {[0,1,2].map(i => <div key={i} className="h-6 w-20 rounded-full bg-white/5" />)}
      </div>
      <div className="h-2 w-full rounded-full bg-white/5" />
      <div className="h-px bg-white/5" />
      <div className="space-y-2">
        {[0,1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-white/5" />)}
      </div>
    </div>
  );
}

// ─── project members preview ───────────────────────────────────────────────────

function ProjectMembersPreview({ members }: { members: UserDTO[] }) {
  if (members.length === 0) return null;
  return (
    <section className="mt-10">
      <div className="h-px bg-white/5 mb-6" />
      <div className="flex items-center gap-2 mb-4">
        <Users size={13} className="text-white/30" />
        <h2 className="label-caps text-white/40">Project Members</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map(m => (
          <div
            key={m.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-label-sm text-white/70 bg-white/5"
          >
            {m.photo_url || m.avatar_url ? (
              <img src={(m.photo_url || m.avatar_url)!} className="w-5 h-5 rounded-full object-cover" alt="" />
            ) : (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-white/10 text-white/50">
                {m.firstName.charAt(0)}
              </span>
            )}
            {m.firstName} {m.lastName}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export const ProjectPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [members, setMembers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useDocumentTitle(project?.name ?? 'Project');

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, ts, ms] = await Promise.all([
        projectService.getProjectById(projectId),
        projectService.getProjectTasks(projectId),
        projectService.getProjectMembers(projectId),
      ]);
      setProject(proj);
      setTasks(ts);
      setMembers(ms);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) navigate('/sign-in');
      else if (status === 404) navigate(`/workspace/${workspaceId}`);
    } finally {
      setLoading(false);
    }
  }, [projectId, workspaceId, navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!projectId || !project) return;
    trackItem({
      id: projectId,
      name: project.name,
      url: `/workspace/${workspaceId}/projects/${projectId}`,
      type: 'sprint',
    });
  }, [projectId, workspaceId, project]);

  const handleTaskCreated = useCallback((t: TaskDTO) => {
    setTasks(prev => [t, ...prev]);
    setShowCreate(false);
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    const snapshot = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await taskService.deleteTask(id);
    } catch {
      setTasks(snapshot);
      showToast('Failed to delete task.');
    }
  }, [tasks]);

  if (loading) {
    return (
      <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <PageSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pb-16 max-w-3xl"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {project && (
        <ProjectHeader
          project={project}
          members={members}
          tasks={tasks}
          onBack={() => navigate(`/workspace/${workspaceId}`)}
        />
      )}

      <div className="h-px bg-white/5 mb-6" />

      <ProjectTaskList
        tasks={tasks}
        projectId={projectId!}
        workspaceId={workspaceId!}
        showCreate={showCreate}
        onCreateOpen={() => setShowCreate(true)}
        onCreateClose={() => setShowCreate(false)}
        onTaskCreated={handleTaskCreated}
        onTaskDeleted={handleDeleteTask}
        onTaskNavigate={id => navigate(`/task/${id}`)}
      />

      <ProjectMembersPreview members={members} />
    </motion.div>
  );
};

export default ProjectPage;
