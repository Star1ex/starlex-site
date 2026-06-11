import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { projectService } from '@/services/api/index.js';
import type { ProjectDTO, CreateProjectRequest } from '@/types/dto.js';
import { modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';
import { DarkSelect } from '@/shared/ui/DarkSelect.js';
import { Glass } from '@/shared/ui/glass/index.js';
import {
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_META,
  PROJECT_STATUSES,
  PROJECT_STATUS_META,
} from '@/entities/project/model/projectMeta.js';

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-body-md text-[color:var(--sx-text)] bg-[color:var(--sx-surface)] outline-none focus:shadow-[var(--sx-focus-ring)] transition-[background,box-shadow] disabled:opacity-40 placeholder:text-[color:var(--sx-text-disabled)]';

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block label-caps text-[color:var(--sx-text-subtle)] mb-1.5">
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
          style={{ background: 'var(--sx-overlay)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <Glass as={motion.div} variant="modal" depth="floating" className="w-full max-w-lg overflow-hidden" variants={modalContentVariants}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-headline-sm font-hanken font-semibold text-[color:var(--sx-text)]">New Project</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-surface-hover)] transition-colors">
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
                    options={PROJECT_STATUSES.map(s => ({ value: s, label: PROJECT_STATUS_META[s].label }))}
                    disabled={loading}
                    className={`${inputCls} h-11 cursor-pointer`}
                  />
                </Field>
                <Field label="Priority">
                  <DarkSelect
                    value={priority ?? 'none'}
                    onChange={(value) => setPriority(value as CreateProjectRequest['priority'])}
                    options={PROJECT_PRIORITIES.map(p => ({ value: p, label: PROJECT_PRIORITY_META[p].label }))}
                    disabled={loading}
                    className={`${inputCls} h-11 cursor-pointer`}
                  />
                </Field>
              </div>
              {error && <p className="text-label-sm text-[color:var(--sx-danger)]">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} disabled={loading} className="flex-1 liquid-button !justify-center">Cancel</button>
                <button type="submit" disabled={loading || !name.trim()}
                  className="flex-1 liquid-button !justify-center !bg-[color:var(--sx-accent)] !border-transparent !text-[color:var(--sx-accent-contrast)] font-semibold disabled:opacity-40">
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
