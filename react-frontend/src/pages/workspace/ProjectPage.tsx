import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Users, X, MoreHorizontal, Trash2, CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react';
import { projectService } from '@/services/api/index.js';
import type { ProjectDTO, TaskDTO, UserDTO, CreateTaskRequest, TaskPriority } from '@/types/dto.js';
import { pageVariants, listItemVariants, listVariants, modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { showToast } from '@/shared/lib/toast.js';

// ─── helpers ────────────────────────────────────────────────────────────────

const PROJECT_STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  backlog:     { label: 'Backlog',     dot: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-800/40',  text: 'text-slate-500 dark:text-slate-400' },
  planned:     { label: 'Planned',     dot: '#a78bfa', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
  in_progress: { label: 'In Progress', dot: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400' },
  paused:      { label: 'Paused',      dot: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400' },
  completed:   { label: 'Completed',   dot: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
  cancelled:   { label: 'Cancelled',   dot: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-500 dark:text-red-400' },
};

const PRIORITY_META: Record<TaskPriority, { label: string; text: string }> = {
  high:   { label: 'High',   text: 'text-orange-500 dark:text-orange-400' },
  medium: { label: 'Medium', text: 'text-amber-500 dark:text-amber-400' },
  low:    { label: 'Low',    text: 'text-blue-500 dark:text-blue-400' },
};

const TASK_PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

function fmtDeadline(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `Due in ${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── create task modal ───────────────────────────────────────────────────────

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (t: TaskDTO) => void;
  projectId: string;
  workspaceId: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreated, projectId, workspaceId }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTaskTitle(''); setDescription(''); setPriority('medium'); setError('');
      setTimeout(() => titleRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = taskTitle.trim();
    if (!trimmed) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      const payload: CreateTaskRequest = {
        task: trimmed,
        description: description.trim(),
        priority,
        workspace_id: workspaceId,
        project_id: projectId,
      };
      const t = await projectService.createProjectTask(projectId, payload);
      onCreated(t);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          variants={modalBackdropVariants} initial="initial" animate="animate" exit="exit"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            variants={modalContentVariants}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>New Task</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title</label>
                <input
                  ref={titleRef}
                  value={taskTitle}
                  onChange={e => { setTaskTitle(e.target.value); setError(''); }}
                  placeholder="Task title"
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description <span className="normal-case font-normal tracking-normal opacity-60">— optional</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe this task…"
                  rows={3}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  {TASK_PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={onClose} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                >Cancel</button>
                <button
                  type="submit" disabled={loading || !taskTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                >{loading ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── task row ────────────────────────────────────────────────────────────────

const TaskRow: React.FC<{
  task: TaskDTO;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ task, onNavigate, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pm = PRIORITY_META[task.priority];

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  const isDone = task.progress === 'done';
  const isInProgress = task.progress === 'in_progress';

  return (
    <motion.div
      variants={listItemVariants}
      className="group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-100 cursor-pointer"
      style={{ border: '1px solid transparent' }}
      onClick={() => onNavigate(task.id)}
      whileHover={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Progress indicator */}
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
        {isDone ? (
          <CheckCircle2 size={17} className="text-green-500" />
        ) : isInProgress ? (
          <Clock size={17} className="text-blue-500" />
        ) : (
          <Circle size={17} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
        )}
      </div>

      {/* Task name */}
      <span
        className={`flex-1 text-sm min-w-0 truncate ${isDone ? 'line-through opacity-50' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {task.task}
      </span>

      {/* Priority */}
      {pm && (
        <span className={`text-xs font-medium flex-shrink-0 ${pm.text}`}>{pm.label}</span>
      )}

      {/* Subtasks count */}
      {task.subtasks && task.subtasks.length > 0 && (
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
          {task.subtasks.filter(s => s.is_done).length}/{task.subtasks.length}
        </span>
      )}

      {/* Context menu */}
      <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
        >
          <MoreHorizontal size={14} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="absolute right-0 top-7 z-20 rounded-lg shadow-xl py-1 min-w-[140px]"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.12 } }}
              exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.08 } }}
            >
              <button
                onClick={() => { onNavigate(task.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <ChevronRight size={13} />
                Open
              </button>
              <button
                onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

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
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/sign-in');
      else if (err?.response?.status === 404) navigate(`/workspace/${workspaceId}`);
    } finally {
      setLoading(false);
    }
  }, [projectId, workspaceId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!projectId || !project) return;
    trackItem({ id: projectId, name: project.name, url: `/workspace/${workspaceId}/projects/${projectId}`, type: 'sprint' });
  }, [projectId, workspaceId, project]);

  const handleTaskCreated = useCallback((t: TaskDTO) => {
    setTasks(prev => [t, ...prev]);
    setShowCreate(false);
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    const snapshot = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      // No deleteTask endpoint in projectService yet; optimistic removal only
    } catch {
      setTasks(snapshot);
      showToast('Failed to delete task.');
    }
  }, [tasks]);

  const sm = project ? (PROJECT_STATUS_META[project.status] ?? PROJECT_STATUS_META.backlog) : null;
  const pm = project ? PRIORITY_META[project.priority as TaskPriority] : null;
  const deadlineFmt = project ? fmtDeadline(project.deadline) : null;

  const notStartedCnt = tasks.filter(t => t.progress === 'not_started').length;
  const inProgressCnt = tasks.filter(t => t.progress === 'in_progress').length;
  const doneCnt = tasks.filter(t => t.progress === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCnt / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <motion.div
          className="w-6 h-6 rounded-full border-2"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-secondary)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen pb-16"
      style={{ background: 'var(--bg-primary)' }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-3xl mx-auto px-6 md:px-10 pt-8 md:pt-12">

        {/* Back breadcrumb */}
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="flex items-center gap-1.5 mb-6 text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to workspace</span>
        </button>

        {/* Project header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {project?.icon ? (
              <span className="text-2xl leading-none">{project.icon}</span>
            ) : null}
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {project?.name ?? 'Project'}
            </h1>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {sm && (
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sm.bg} ${sm.text}`}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
                {sm.label}
              </span>
            )}
            {pm && (
              <span className={`text-xs font-medium ${pm.text}`}>{pm.label} priority</span>
            )}
            {deadlineFmt && (
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {deadlineFmt}
              </span>
            )}
            {members.length > 0 && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <Users size={11} />
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Description / goal */}
          {project?.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {project.description}
            </p>
          )}
          {project?.goal && (
            <div className="mt-2 pl-3" style={{ borderLeft: '2px solid var(--border-color)' }}>
              <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-secondary)' }}>Goal</p>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{project.goal}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              <span>{progress}% complete</span>
              <span>{doneCnt}/{tasks.length} done</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <motion.div
                className="h-full rounded-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%`, transition: { duration: 0.6, ease: 'easeOut' } }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {notStartedCnt > 0 && <span>{notStartedCnt} not started</span>}
              {inProgressCnt > 0 && <span className="text-blue-500">{inProgressCnt} in progress</span>}
              {doneCnt > 0 && <span className="text-green-500">{doneCnt} done</span>}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: 'var(--border-color)' }} />

        {/* Tasks section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Tasks
            </h2>
            <motion.button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={14} />
              New Task
            </motion.button>
          </div>

          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="flex flex-col items-center justify-center py-12 text-center rounded-2xl"
              style={{ border: '1.5px dashed var(--border-color)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--bg-secondary)' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No tasks yet</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                Add the first task to get started
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
              >
                <Plus size={14} />
                Add Task
              </button>
            </motion.div>
          ) : (
            <motion.div
              variants={listVariants}
              initial="initial"
              animate="animate"
              className="space-y-0.5"
            >
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onNavigate={id => navigate(`/task/${id}`)}
                  onDelete={handleDeleteTask}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* Members */}
        {members.length > 0 && (
          <section className="mt-10">
            <div className="h-px mb-6" style={{ background: 'var(--border-color)' }} />
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-secondary)' }}>
              Members
            </h2>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {m.photo_url || m.avatar_url ? (
                    <img src={(m.photo_url || m.avatar_url)!} className="w-5 h-5 rounded-full object-cover" alt="" />
                  ) : (
                    <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      {m.firstName.charAt(0)}
                    </span>
                  )}
                  <span>{m.firstName} {m.lastName}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleTaskCreated}
        projectId={projectId!}
        workspaceId={workspaceId!}
      />
    </motion.div>
  );
};

export default ProjectPage;
