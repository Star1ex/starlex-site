import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdropVariants, modalContentVariants } from '@/shared/lib/animations.js';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
  hideClose?: boolean;
};

export const Modal = ({ open, onClose, children, maxWidth = 'max-w-xl', hideClose = false }: Props) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className={`w-full ${maxWidth} rounded-2xl bg-white dark:bg-dark-surface shadow-modal relative pointer-events-auto`}
              variants={modalContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {!hideClose && (
                <button
                  aria-label="Close"
                  onClick={onClose}
                  className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-dark-border text-gray-500 dark:text-dark-text-muted hover:bg-gray-200 dark:hover:bg-dark-border/80 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
              <div className="p-8">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
