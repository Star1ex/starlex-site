import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import type { WorkspaceDTO } from '@/types/dto.js';
import { modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';

interface WorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (workspace: WorkspaceDTO) => void;
}

export const WorkspaceCreateModal: React.FC<WorkspaceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required'); return; }

    setLoading(true);
    setError('');
    try {
      const ws = await workspaceService.createWorkspace({ name: trimmed, description: description.trim() });
      window.dispatchEvent(new CustomEvent('workspaceCreated'));
      onCreated(ws);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            variants={modalContentVariants}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                New Workspace
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Name
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => { setName(e.target.value); setError(''); }}
                  placeholder="My Workspace"
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description
                  <span className="normal-case font-normal ml-1 tracking-normal" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                    — optional
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What is this workspace for?"
                  rows={3}
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none transition-colors"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                >
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
