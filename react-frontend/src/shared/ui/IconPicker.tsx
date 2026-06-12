import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { ICONS } from './IconPickerIcons.js';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  size?: number;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, size = 20 }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerH = 260;
    const pickerW = 248;
    let top = rect.bottom + 6;
    let left = rect.left;
    if (top + pickerH > window.innerHeight) top = rect.top - pickerH - 6;
    if (left + pickerW > window.innerWidth) left = window.innerWidth - pickerW - 8;
    setPos({ top, left });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        title="Set icon"
        className="flex items-center justify-center rounded-md transition-colors hover:opacity-80"
        style={{
          width: size + 8,
          height: size + 8,
          fontSize: size,
          lineHeight: 1,
          background: 'transparent',
        }}
      >
        {value || <span style={{ fontSize: size * 0.7, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>+</span>}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.12, ease: 'easeOut' } }}
                exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.08 } }}
                className="fixed z-[9999] overflow-y-auto rounded-xl p-2"
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: 248,
                  maxHeight: 260,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                }}
              >
                <div className="grid grid-cols-7 gap-0.5">
                  {ICONS.map(({ value: v, label }) => (
                    <button
                      key={v || '_none'}
                      title={label}
                      onClick={() => { onChange(v); setOpen(false); }}
                      className="flex items-center justify-center rounded-lg transition-colors"
                      style={{
                        width: 32,
                        height: 32,
                        fontSize: v ? 18 : 11,
                        background: value === v ? 'var(--bg-secondary)' : 'transparent',
                        color: v ? undefined : 'var(--text-secondary)',
                        fontFamily: v ? undefined : 'monospace',
                      }}
                    >
                      {v || '∅'}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default IconPicker;
