import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MarkdownEditor } from '@/components/TaskView/MarkdownEditor.js';
import { useDebounce } from '@/shared/hooks/useDebounce.js';

interface SprintDescriptionModalProps {
  isOpen: boolean;
  sprintName: string;
  description: string;
  onClose: () => void;
  onSave?: (description: string) => void;
}

export const SprintDescriptionModal: React.FC<SprintDescriptionModalProps> = ({
  isOpen,
  sprintName,
  description,
  onClose,
  onSave,
}) => {
  const [value, setValue] = useState(description);
  const lastSavedRef = useRef(description);
  const debouncedValue = useDebounce(value, 600);

  // Sync when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setValue(description);
      lastSavedRef.current = description;
    }
  }, [isOpen, description]);

  // Auto-save on debounced change
  useEffect(() => {
    if (!isOpen || !onSave) return;
    if (debouncedValue === lastSavedRef.current) return;
    lastSavedRef.current = debouncedValue;
    onSave(debouncedValue);
  }, [debouncedValue, isOpen, onSave]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18 } }}
          exit={{ opacity: 0, transition: { duration: 0.14 } }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal box */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={sprintName}
            className="relative rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
              width: 'min(1400px, calc(100vw - 48px))',
              height: 'calc(100vh - 80px)',
            }}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.14 } }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pt-7 pb-2 flex-shrink-0 mx-auto w-full" style={{ maxWidth: '780px', paddingLeft: '2rem', paddingRight: '2rem' }}>
              <h2
                className="text-2xl font-semibold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {sprintName}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:opacity-60 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto pb-6 pt-1">
              <div className="mx-auto" style={{ maxWidth: '780px', paddingLeft: '2rem', paddingRight: '2rem' }}>
              <MarkdownEditor
                value={value}
                onChange={setValue}
                placeholder="Add a description..."
                containerClassName="sprint-desc-editor"
              />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SprintDescriptionModal;
