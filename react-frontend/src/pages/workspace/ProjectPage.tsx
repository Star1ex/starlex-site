import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutList, Kanban } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { projectService, taskService } from '@/services/api/index.js';
import type { ProjectDTO, TaskDTO, TaskStatus, UserDTO } from '@/types/dto.js';
import { pageVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { showToast } from '@/shared/lib/toast.js';
import { can } from '@/shared/lib/permissions.js';
import { ProjectHeader, ProjectPropertiesPanel } from './ProjectHeader.js';
import { ProjectTaskList } from './ProjectTaskList.js';
import ProjectBoard from '@/features/taskBoard/LazyTaskBoard.js';
import { preloadTaskBoard } from '@/app/routePreload.js';

// ─── page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 rounded-lg bg-[color:var(--sx-control)]" />
      <div className="h-9 w-64 rounded-xl bg-[color:var(--sx-control)]" />
      <div className="flex gap-2">
        {[0,1,2].map(i => <div key={i} className="h-6 w-20 rounded-full bg-[color:var(--sx-control)]" />)}
      </div>
      <div className="h-2 w-full rounded-full bg-[color:var(--sx-control)]" />
      <div className="h-px bg-[color:var(--sx-border)]" />
      <div className="space-y-2">
        {[0,1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-[color:var(--sx-control)]" />)}
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────────

export const ProjectPage: React.FC = () => {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [members, setMembers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('list');

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

  const handleTaskStatusChange = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, status } : task));
  }, []);

  if (loading) {
    return (
      <motion.div className="pb-16" variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <PageSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="project-detail-page pb-16"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {project && (
        <div className="project-detail-grid">
          <main className="project-detail-main">
            <ProjectHeader
              key={project.id}
              project={project}
              tasks={tasks}
              workspaceRole={activeWorkspace?.role}
              currentUserId={userId ?? undefined}
              onBack={() => navigate(`/workspace/${workspaceId}`)}
              onProjectChange={setProject}
            />

            <div className="project-task-toolbar">
              <div className="project-view-toggle">
                <button
                  onClick={() => setView('list')}
                  className={view === 'list' ? 'is-active' : ''}
                >
                  <LayoutList size={13} /> List
                </button>
                <button
                  onMouseEnter={preloadTaskBoard}
                  onFocus={preloadTaskBoard}
                  onClick={() => setView('board')}
                  className={view === 'board' ? 'is-active' : ''}
                >
                  <Kanban size={13} /> Board
                </button>
              </div>
            </div>

            {view === 'list' ? (
              <ProjectTaskList
                tasks={tasks}
                projectId={projectId!}
                workspaceId={workspaceId!}
                showCreate={showCreate}
                onCreateOpen={() => setShowCreate(true)}
                onCreateClose={() => setShowCreate(false)}
                onTaskCreated={handleTaskCreated}
                onTaskDeleted={handleDeleteTask}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskNavigate={id => navigate(`/task/${id}`)}
                role={activeWorkspace?.role}
                currentUserId={userId ?? undefined}
              />
            ) : (
              <ProjectBoard tasks={tasks} onTasksChange={setTasks} canEdit={can.editTask(activeWorkspace?.role)} />
            )}
          </main>

          <ProjectPropertiesPanel
            project={project}
            members={members}
            tasks={tasks}
            workspaceRole={activeWorkspace?.role}
            currentUserId={userId ?? undefined}
            onProjectChange={setProject}
            onProjectDeleted={() => navigate(`/workspace/${workspaceId}`)}
          />
        </div>
      )}
    </motion.div>
  );
};

export default ProjectPage;
