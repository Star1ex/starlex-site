import React, { useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const MarkdownPreview = React.lazy(() =>
  import('@/components/TaskView/MarkdownPreview.js').then((m) => ({ default: m.MarkdownPreview }))
);

interface SprintDescriptionModalProps {
  isOpen: boolean;
  sprintName: string;
  description: string;
  onClose: () => void;
}

export const SprintDescriptionModal: React.FC<SprintDescriptionModalProps> = ({
  isOpen,
  sprintName,
  description,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-primary)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4 flex-shrink-0">
            <h2
              className="text-2xl font-semibold tracking-tight truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {sprintName}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 hover:opacity-60"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-12">
            <div className="max-w-3xl mx-auto">
              {description ? (
                <Suspense fallback={<div className="animate-pulse h-8 rounded" style={{ background: 'var(--bg-secondary)' }} />}>
                  <MarkdownPreview value={description} />
                </Suspense>
              ) : (
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  No description yet.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SprintDescriptionModal;
