import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import type { WorkspaceDTO } from '@/types/dto.js';
import { modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';
import { WorkspaceIdentityForm } from '@/shared/ui/WorkspaceIdentityForm.js';
import { WORKSPACE_ACCENT_PRESETS } from '@/shared/lib/workspaceIdentity.js';

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
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState<string>(WORKSPACE_ACCENT_PRESETS[0].value);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIcon('');
      setColor(WORKSPACE_ACCENT_PRESETS[0].value);
      setDescription('');
      setError('');
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
      const nextIcon = icon.trim() || trimmed.slice(0, 2).toUpperCase();
      const ws = await workspaceService.createWorkspace({
        name: trimmed,
        icon: nextIcon,
        color,
        description: description.trim() || undefined,
      });
      window.dispatchEvent(new CustomEvent('workspaceCreated'));
      onCreated({ ...ws, icon: nextIcon, color });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to create workspace');
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
          style={{ background: 'var(--sx-overlay)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="glass-card workspace-create-modal w-full max-w-lg rounded-2xl overflow-hidden"
            variants={modalContentVariants}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-headline-sm font-hanken font-semibold text-[color:var(--sx-text)]">
                New Workspace
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-control)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
              <WorkspaceIdentityForm
                name={name}
                onNameChange={(value) => { setName(value); setError(''); }}
                icon={icon}
                onIconChange={(value) => { setIcon(value); setError(''); }}
                color={color}
                onColorChange={setColor}
                description={description}
                onDescriptionChange={setDescription}
                error={error}
                disabled={loading}
                autoFocus
                showDescription
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 liquid-button !justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 liquid-button !justify-center !border-transparent !text-[color:var(--starlex-accent-contrast)] font-semibold disabled:opacity-40"
                  style={{ background: color, boxShadow: `0 12px 34px ${color}32` }}
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
