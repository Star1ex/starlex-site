import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Layers, X, MoreHorizontal, Trash2 } from 'lucide-react';
import { workspaceService, projectService, userService } from '@/services/api/index.js';
import type { ProjectDTO, WorkspaceDTO, UserDTO, CreateProjectRequest } from '@/types/dto.js';
import { pageVariants, listItemVariants, listVariants, modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';
import { trackItem } from '@/shared/lib/recentItems.js';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle.js';
import { showToast } from '@/shared/lib/toast.js';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  backlog:     { label: 'Backlog',      dot: '#94a3b8', bg: 'bg-slate-100 dark:bg-slate-800/40',  text: 'text-slate-500 dark:text-slate-400' },
  planned:     { label: 'Planned',      dot: '#a78bfa', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
  in_progress: { label: 'In Progress',  dot: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400' },
  paused:      { label: 'Paused',       dot: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400' },
  completed:   { label: 'Completed',    dot: '#22c55e', bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
  cancelled:   { label: 'Cancelled',    dot: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-500 dark:text-red-400' },
};

const PRIORITY_META: Record<string, { label: string; text: string }> = {
  none:   { label: '—',      text: 'text-gray-400 dark:text-gray-500' },
  urgent: { label: 'Urgent', text: 'text-red-500 dark:text-red-400' },
  high:   { label: 'High',   text: 'text-orange-500 dark:text-orange-400' },
  medium: { label: 'Medium', text: 'text-amber-500 dark:text-amber-400' },
  low:    { label: 'Low',    text: 'text-blue-500 dark:text-blue-400' },
};

const PROJECT_STATUS_OPTIONS = ['backlog','planned','in_progress','paused','completed','cancelled'] as const;
const PROJECT_PRIORITY_OPTIONS = ['none','urgent','high','medium','low'] as const;

// ─── create project modal ────────────────────────────────────────────────────

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (p: ProjectDTO) => void;
  workspaceId: string;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreated, workspaceId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState<CreateProjectRequest['status']>('backlog');
  const [priority, setPriority] = useState<CreateProjectRequest['priority']>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(''); setDescription(''); setGoal(''); setStatus('backlog'); setPriority('none'); setError('');
      setTimeout(() => nameRef.current?.focus(), 60);
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
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try {
      const p = await projectService.createProject(workspaceId, {
        name: trimmed,
        description: description.trim(),
        goal: goal.trim(),
        status,
        priority,
      });
      onCreated(p);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>New Project</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <Field label="Name">
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Project name"
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </Field>

              <Field label="Description" optional>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description…"
                  rows={2}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </Field>

              <Field label="Goal" optional>
                <input
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  placeholder="What does success look like?"
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {PROJECT_STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {PROJECT_PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{PRIORITY_META[p]?.label ?? p}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={onClose} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                >Cancel</button>
                <button
                  type="submit" disabled={loading || !name.trim()}
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

const Field: React.FC<{ label: string; optional?: boolean; children: React.ReactNode }> = ({ label, optional, children }) => (
  <div>
    <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
      {label}
      {optional && <span className="normal-case font-normal ml-1 tracking-normal opacity-60"> — optional</span>}
    </label>
    {children}
  </div>
);

// ─── project card ────────────────────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: ProjectDTO;
  index: number;
  onDelete: (id: string) => void;
  onClick: () => void;
}> = ({ project, index, onDelete, onClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sm = STATUS_META[project.status] ?? STATUS_META.backlog;
  const pm = PRIORITY_META[project.priority] ?? PRIORITY_META.none;

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  return (
    <motion.div
      variants={listItemVariants}
      className="group relative rounded-xl p-4 cursor-pointer transition-all duration-150 select-none"
      style={{ background: 'var(--bg-secondary)', border: '1px solid transparent' }}
      onClick={onClick}
      whileHover={{ borderColor: 'var(--border-color)', scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      {/* Icon + name */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {project.icon ? (
            <span className="text-xl leading-none flex-shrink-0">{project.icon}</span>
          ) : (
            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {project.name}
          </span>
        </div>

        {/* Context menu */}
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(p => !p); }}
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
                  onClick={e => { e.stopPropagation(); onDelete(project.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {project.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sm.bg} ${sm.text}`}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sm.dot }} />
          {sm.label}
        </span>
        {project.priority !== 'none' && (
          <span className={`text-xs font-medium ${pm.text}`}>{pm.label}</span>
        )}
        {project.member_ids.length > 0 && (
          <span className="flex items-center gap-0.5 text-xs ml-auto" style={{ color: 'var(--text-secondary)' }}>
            <Users size={11} />
            {project.member_ids.length}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

export const WorkspacePage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<WorkspaceDTO | null>(null);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [members, setMembers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useDocumentTitle(workspace?.name ?? 'Workspace');

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [ps, ms, wsList] = await Promise.all([
        projectService.getWorkspaceProjects(workspaceId),
        workspaceService.getWorkspaceUsers(workspaceId),
        userService.getWorkspaces(),
      ]);
      setProjects(ps);
      setMembers(ms);
      const ws = wsList.find(w => w.id === workspaceId) ?? null;
      setWorkspace(ws);
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/sign-in');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Track as recent when we have the workspace name
  useEffect(() => {
    if (!workspaceId || !workspace) return;
    trackItem({ id: workspaceId, name: workspace.name, url: `/workspace/${workspaceId}`, type: 'workspace' });
  }, [workspaceId, workspace]);

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
      <div className="max-w-5xl mx-auto px-6 md:px-10 pt-10 md:pt-14">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {workspace?.name ?? workspaceId}
              </h1>
              {workspace?.description && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {workspace.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Layers size={14} />
                <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <Users size={14} />
                <span>{members.length} member{members.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: 'var(--border-color)' }} />

        {/* Projects section */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Projects
            </h2>
            <motion.button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={14} />
              New Project
            </motion.button>
          </div>

          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              className="flex flex-col items-center justify-center py-16 text-center rounded-2xl"
              style={{ border: '1.5px dashed var(--border-color)' }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--bg-secondary)' }}>
                <Layers size={20} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No projects yet</p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                Create your first project to get started
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
              >
                <Plus size={14} />
                Create Project
              </button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              variants={listVariants}
              initial="initial"
              animate="animate"
            >
              {projects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  onDelete={handleDeleteProject}
                  onClick={() => navigate(`/workspace/${workspaceId}/projects/${p.id}`)}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* Members section */}
        {members.length > 0 && (
          <section className="mt-10">
            <div className="h-px mb-8" style={{ background: 'var(--border-color)' }} />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Members
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <motion.button
                  key={m.id}
                  onClick={() => navigate(`/profile/${m.id}`)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid transparent' }}
                  whileHover={{ borderColor: 'var(--border-color)' }}
                >
                  {m.photo_url || m.avatar_url ? (
                    <img src={m.photo_url || m.avatar_url || ''} className="w-5 h-5 rounded-full object-cover" alt="" />
                  ) : (
                    <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                      style={{ background: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      {m.firstName.charAt(0)}
                    </span>
                  )}
                  <span>{m.firstName} {m.lastName}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>

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
