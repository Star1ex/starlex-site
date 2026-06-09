import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { projectService } from '@/services/api/index.js';
import type { ProjectDTO, CreateProjectRequest } from '@/types/dto.js';
import { modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';
import { DarkSelect } from '@/shared/ui/DarkSelect.js';

const STATUS_META: Record<string, string> = {
  backlog: 'Backlog', planned: 'Planned', in_progress: 'In Progress',
  paused: 'Paused', completed: 'Completed', cancelled: 'Cancelled',
};

const PRIORITY_META: Record<string, string> = {
  none: 'None', urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
};

const STATUS_OPTIONS = ['backlog','planned','in_progress','paused','completed','cancelled'] as const;
const PRIORITY_OPTIONS = ['none','urgent','high','medium','low'] as const;

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-body-md text-white bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-all disabled:opacity-40 placeholder:text-white/30';

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block label-caps text-white/40 mb-1.5">
        {label}{optional && <span className="normal-case font-normal ml-1 tracking-normal opacity-60"> — optional</span>}
      </label>
      {children}
    </div>
  );
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (p: ProjectDTO) => void;
  workspaceId: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onCreated, workspaceId }) => {
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
        description: description.trim() || undefined,
        goal: goal.trim() || undefined,
        status,
        priority,
      });
      onCreated(p);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create project');
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
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div className="glass-card w-full max-w-lg rounded-2xl overflow-hidden" variants={modalContentVariants}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-headline-sm font-hanken font-semibold text-white">New Project</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              <Field label="Name">
                <input ref={nameRef} value={name} onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="Project name" disabled={loading} className={inputCls} />
              </Field>
              <Field label="Description" optional>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description…" rows={2} disabled={loading} className={`${inputCls} resize-none`} />
              </Field>
              <Field label="Goal" optional>
                <input value={goal} onChange={e => setGoal(e.target.value)}
                  placeholder="What does success look like?" disabled={loading} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <DarkSelect
                    value={status ?? 'backlog'}
                    onChange={(value) => setStatus(value as CreateProjectRequest['status'])}
                    options={STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_META[s] ?? s }))}
                    disabled={loading}
                    className={`${inputCls} h-11 cursor-pointer`}
                  />
                </Field>
                <Field label="Priority">
                  <DarkSelect
                    value={priority ?? 'none'}
                    onChange={(value) => setPriority(value as CreateProjectRequest['priority'])}
                    options={PRIORITY_OPTIONS.map(p => ({ value: p, label: PRIORITY_META[p] ?? p }))}
                    disabled={loading}
                    className={`${inputCls} h-11 cursor-pointer`}
                  />
                </Field>
              </div>
              {error && <p className="text-label-sm text-[#fca5a5]">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} disabled={loading} className="flex-1 liquid-button !justify-center">Cancel</button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="flex-1 liquid-button !justify-center !bg-[--accent] !border-transparent !text-white font-semibold disabled:opacity-40">
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
