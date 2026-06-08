import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Clock, MoreHorizontal, Trash2, ChevronRight, X } from 'lucide-react';
import { projectService } from '@/services/api/index.js';
import type { TaskDTO, TaskPriority, CreateTaskRequest } from '@/types/dto.js';
import { listVariants, listItemVariants, modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  high:   { label: 'High',   cls: 'text-orange-400' },
  medium: { label: 'Medium', cls: 'text-amber-400' },
  low:    { label: 'Low',    cls: 'text-blue-400' },
};

const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];

// ─── create task modal ─────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (t: TaskDTO) => void;
  projectId: string;
  workspaceId: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onCreated, projectId, workspaceId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setDescription(''); setPriority('medium'); setError('');
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
    const trimmed = title.trim();
    if (!trimmed) { setError('Title is required'); return; }
    setLoading(true); setError('');
    try {
      const payload: CreateTaskRequest = {
        task: trimmed,
        description: description.trim() || undefined,
        priority,
        workspace_id: workspaceId,
        project_id: projectId,
      };
      const t = await projectService.createProjectTask(projectId, payload);
      onCreated(t);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-body-md text-white bg-white/5 border border-white/10 outline-none focus:border-white/25 focus:ring-1 focus:ring-white/15 transition-all disabled:opacity-40 placeholder:text-white/30';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          variants={modalBackdropVariants} initial="initial" animate="animate" exit="exit"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden" variants={modalContentVariants}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-headline-sm font-hanken font-semibold text-white">New Task</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="label-caps text-white/40 block mb-1.5">Title</label>
                <input ref={titleRef} value={title} onChange={e => { setTitle(e.target.value); setError(''); }} placeholder="Task title" disabled={loading} className={inputCls} />
              </div>
              <div>
                <label className="label-caps text-white/40 block mb-1.5">
                  Description <span className="normal-case font-normal tracking-normal opacity-60">— optional</span>
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this task…" rows={3} disabled={loading} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="label-caps text-white/40 block mb-1.5">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} disabled={loading} className={`${inputCls} cursor-pointer`}>
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
                </select>
              </div>
              {error && <p className="text-label-sm text-[#fca5a5]">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} disabled={loading} className="flex-1 liquid-button !justify-center">Cancel</button>
                <button type="submit" disabled={loading || !title.trim()} className="flex-1 liquid-button !justify-center !bg-[--accent] !border-transparent !text-white font-semibold disabled:opacity-40">
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── task row ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskDTO;
  onNavigate: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskRow({ task, onNavigate, onDelete }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pm = PRIORITY_META[task.priority];
  const isDone = task.progress === 'done';
  const isInProgress = task.progress === 'in_progress';

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
      className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-white/4 transition-all"
      onClick={() => onNavigate(task.id)}
    >
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
        {isDone ? (
          <CheckCircle2 size={17} className="text-green-400" />
        ) : isInProgress ? (
          <Clock size={17} className="text-blue-400" />
        ) : (
          <Circle size={17} className="text-white/20" />
        )}
      </div>

      <span className={`flex-1 text-body-md min-w-0 truncate ${isDone ? 'line-through text-white/30' : 'text-white/80'}`}>
        {task.task}
      </span>

      {pm && <span className={`text-label-sm font-medium flex-shrink-0 ${pm.cls}`}>{pm.label}</span>}

      {task.subtasks && task.subtasks.length > 0 && (
        <span className="text-label-sm text-white/30 flex-shrink-0">
          {task.subtasks.filter(s => s.is_done).length}/{task.subtasks.length}
        </span>
      )}

      <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="w-6 h-6 flex items-center justify-center rounded text-white/25 opacity-0 group-hover:opacity-100 hover:text-white/70 transition-all"
        >
          <MoreHorizontal size={14} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="dropdown-menu absolute right-0 top-7 z-20 min-w-[130px]"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.1 } }}
              exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.07 } }}
            >
              <button onClick={() => { onNavigate(task.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-white/70 hover:bg-white/5 transition-colors rounded-lg">
                <ChevronRight size={13} /> Open
              </button>
              <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-label-sm text-red-400 hover:bg-red-900/20 transition-colors rounded-lg">
                <Trash2 size={13} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── task list section ─────────────────────────────────────────────────────────

interface ProjectTaskListProps {
  tasks: TaskDTO[];
  projectId: string;
  workspaceId: string;
  showCreate: boolean;
  onCreateOpen: () => void;
  onCreateClose: () => void;
  onTaskCreated: (t: TaskDTO) => void;
  onTaskDeleted: (id: string) => void;
  onTaskNavigate: (id: string) => void;
}

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({
  tasks,
  projectId,
  workspaceId,
  showCreate,
  onCreateOpen,
  onCreateClose,
  onTaskCreated,
  onTaskDeleted,
  onTaskNavigate,
}) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="label-caps text-white/40">Tasks</h2>
      <button onClick={onCreateOpen} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm">
        <Plus size={13} />
        New Task
      </button>
    </div>

    {tasks.length === 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="flex flex-col items-center justify-center py-12 text-center rounded-2xl"
        style={{ border: '1.5px dashed rgba(255,255,255,0.08)' }}
      >
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <CheckCircle2 size={18} className="text-white/20" />
        </div>
        <p className="text-body-md font-medium text-white/50 mb-1">No tasks yet</p>
        <p className="text-label-sm text-white/30 mb-5">Add the first task to get started</p>
        <button onClick={onCreateOpen} className="liquid-button gap-1.5 !bg-[--accent] !border-transparent !text-white">
          <Plus size={14} /> Add Task
        </button>
      </motion.div>
    ) : (
      <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-0.5">
        {tasks.map(t => (
          <TaskRow
            key={t.id}
            task={t}
            onNavigate={onTaskNavigate}
            onDelete={onTaskDeleted}
          />
        ))}
      </motion.div>
    )}

    <CreateTaskModal
      isOpen={showCreate}
      onClose={onCreateClose}
      onCreated={onTaskCreated}
      projectId={projectId}
      workspaceId={workspaceId}
    />
  </section>
);
