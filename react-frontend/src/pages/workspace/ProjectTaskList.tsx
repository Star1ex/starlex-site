import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, MoreHorizontal, Trash2, ChevronRight, X } from 'lucide-react';
import { projectService } from '@/services/api/index.js';
import type { TaskDTO, TaskPriority, CreateTaskRequest, WorkspaceRole, TaskStatus } from '@/types/dto.js';
import { listVariants, listItemVariants, modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';
import { can } from '@/shared/lib/permissions.js';
import { InlineLabelChips } from '@/shared/ui/LabelPicker.js';
import { StatusMenu } from '@/features/taskStatus/StatusMenu.js';
import { DarkSelect } from '@/shared/ui/DarkSelect.js';
import { Glass } from '@/shared/ui/glass/index.js';
import { TASK_PRIORITIES, TASK_PRIORITY_META } from '@/entities/task/model/taskMeta.js';

const CREATE_PRIORITY_OPTIONS: TaskPriority[] = TASK_PRIORITIES.filter(
  (priority) => priority !== 'urgent' && priority !== 'none',
);

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

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-body-md text-[color:var(--sx-text)] bg-[color:var(--sx-surface)] outline-none focus:shadow-[var(--sx-focus-ring)] transition-[background,box-shadow] disabled:opacity-40 placeholder:text-[color:var(--sx-text-disabled)]';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          variants={modalBackdropVariants} initial="initial" animate="animate" exit="exit"
          style={{ background: 'var(--sx-overlay)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <Glass as={motion.div} variant="modal" depth="floating" className="w-full max-w-lg overflow-hidden" variants={modalContentVariants}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-headline-sm font-hanken font-semibold text-[color:var(--sx-text)]">New Task</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-surface-hover)] transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <div>
                <label className="label-caps text-[color:var(--sx-text-subtle)] block mb-1.5">Title</label>
                <input ref={titleRef} value={title} onChange={e => { setTitle(e.target.value); setError(''); }} placeholder="Task title" disabled={loading} className={inputCls} />
              </div>
              <div>
                <label className="label-caps text-[color:var(--sx-text-subtle)] block mb-1.5">
                  Description <span className="normal-case font-normal tracking-normal opacity-60">— optional</span>
                </label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this task…" rows={3} disabled={loading} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="label-caps text-[color:var(--sx-text-subtle)] block mb-1.5">Priority</label>
                <DarkSelect
                  value={priority}
                  onChange={(value) => setPriority(value as TaskPriority)}
                  options={CREATE_PRIORITY_OPTIONS.map(p => ({ value: p, label: TASK_PRIORITY_META[p].label }))}
                  disabled={loading}
                  className={`${inputCls} h-11 cursor-pointer`}
                />
              </div>
              {error && <p className="text-label-sm text-[color:var(--sx-danger)]">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} disabled={loading} className="flex-1 liquid-button !justify-center">Cancel</button>
                <button type="submit" disabled={loading || !title.trim()} className="flex-1 liquid-button !justify-center !bg-[color:var(--sx-accent)] !border-transparent !text-[color:var(--sx-accent-contrast)] font-semibold disabled:opacity-40">
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </Glass>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── task row ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskDTO;
  onNavigate: (id: string) => void;
  onDelete?: (id: string) => void;
  canEditStatus: boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function TaskRow({ task, onNavigate, onDelete, canEditStatus, onStatusChange }: TaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const priorityMeta = task.priority !== 'none' ? TASK_PRIORITY_META[task.priority] : null;
  const isDone = task.status === 'done';

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
      className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-[color:var(--sx-surface-hover)] transition-colors"
      onClick={() => onNavigate(task.id)}
    >
      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
        <StatusMenu
          taskId={task.id}
          status={task.status}
          canEdit={canEditStatus}
          onStatusChange={(status) => onStatusChange(task.id, status)}
        />
      </div>

      <span className={`flex-1 text-body-md min-w-0 truncate ${isDone ? 'line-through text-[color:var(--sx-text-subtle)]' : 'text-[color:var(--sx-text)]'}`}>
        {task.task}
      </span>

      {task.labels && task.labels.length > 0 && (
        <div className="flex-shrink-0 hidden sm:flex">
          <InlineLabelChips labels={task.labels} maxVisible={2} />
        </div>
      )}

      {priorityMeta && (
        <span className="text-label-sm font-medium flex-shrink-0" style={{ color: priorityMeta.color }}>
          {priorityMeta.label}
        </span>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <span className="text-label-sm text-[color:var(--sx-text-subtle)] flex-shrink-0">
          {task.subtasks.filter(s => s.is_done).length}/{task.subtasks.length}
        </span>
      )}

      <div ref={menuRef} className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="w-6 h-6 flex items-center justify-center rounded text-[color:var(--sx-text-disabled)] opacity-0 group-hover:opacity-100 hover:text-[color:var(--sx-text)] transition-all"
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
                className="dropdown-menu-item">
                <ChevronRight size={13} /> Open
              </button>
              {onDelete && (
                <button onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                  className="dropdown-menu-item dropdown-menu-item--danger">
                  <Trash2 size={13} /> Delete
                </button>
              )}
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
  onTaskStatusChange: (id: string, status: TaskStatus) => void;
  onTaskNavigate: (id: string) => void;
  role?: WorkspaceRole;
  currentUserId?: string;
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
  onTaskStatusChange,
  onTaskNavigate,
  role,
  currentUserId,
}) => {
  const canCreate = can.createTask(role);
  const canEditStatus = can.editTask(role);
  return (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="label-caps text-[color:var(--sx-text-subtle)]">Tasks</h2>
      {canCreate && (
        <button onClick={onCreateOpen} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm">
          <Plus size={13} />
          New Task
        </button>
      )}
    </div>

    {tasks.length === 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
        className="flex flex-col items-center justify-center py-12 text-center rounded-2xl"
        style={{ background: 'var(--sx-canvas-elevated)' }}
      >
        <div className="w-10 h-10 rounded-xl bg-[color:var(--sx-surface)] flex items-center justify-center mb-3">
          <CheckCircle2 size={18} className="text-[color:var(--sx-text-disabled)]" />
        </div>
        <p className="text-body-md font-medium text-[color:var(--sx-text-muted)] mb-1">No tasks yet</p>
        <p className="text-label-sm text-[color:var(--sx-text-subtle)] mb-5">Add the first task to get started</p>
        {canCreate && (
          <button onClick={onCreateOpen} className="liquid-button gap-1.5 !bg-[color:var(--sx-accent)] !border-transparent !text-[color:var(--sx-accent-contrast)]">
            <Plus size={14} /> Add Task
          </button>
        )}
      </motion.div>
    ) : (
      <motion.div variants={listVariants} initial="initial" animate="animate" className="space-y-0.5">
        {tasks.map(t => (
          <TaskRow
            key={t.id}
            task={t}
            onNavigate={onTaskNavigate}
            onDelete={can.deleteTask(role, t.owner_id === currentUserId) ? onTaskDeleted : undefined}
            canEditStatus={canEditStatus}
            onStatusChange={onTaskStatusChange}
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
};
