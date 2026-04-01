import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Curated minimalist icon set — like Notion
export const ICONS = [
  // No icon
  { value: '', label: 'None' },
  // Tech / Dev
  { value: '💻', label: 'Laptop' },
  { value: '🖥️', label: 'Desktop' },
  { value: '⌨️', label: 'Keyboard' },
  { value: '🖱️', label: 'Mouse' },
  { value: '📱', label: 'Phone' },
  { value: '🔧', label: 'Wrench' },
  { value: '⚙️', label: 'Settings' },
  { value: '🔌', label: 'Plug' },
  { value: '💾', label: 'Save' },
  { value: '📡', label: 'Antenna' },
  { value: '🤖', label: 'Robot' },
  // Knowledge / Learning
  { value: '📚', label: 'Books' },
  { value: '📖', label: 'Open book' },
  { value: '🎓', label: 'Graduation' },
  { value: '🧠', label: 'Brain' },
  { value: '🔬', label: 'Microscope' },
  { value: '🧪', label: 'Test tube' },
  { value: '📐', label: 'Ruler' },
  { value: '✏️', label: 'Pencil' },
  { value: '📝', label: 'Notepad' },
  // Fitness / Health
  { value: '🏋️', label: 'Dumbbell' },
  { value: '🤸', label: 'Gymnastics' },
  { value: '🏃', label: 'Running' },
  { value: '💪', label: 'Muscle' },
  { value: '🧘', label: 'Yoga' },
  // Business / Work
  { value: '📊', label: 'Chart' },
  { value: '📈', label: 'Growth' },
  { value: '💼', label: 'Briefcase' },
  { value: '🤝', label: 'Handshake' },
  { value: '📋', label: 'Clipboard' },
  { value: '💡', label: 'Idea' },
  { value: '🎯', label: 'Target' },
  { value: '🚀', label: 'Rocket' },
  // Creative
  { value: '🎨', label: 'Palette' },
  { value: '🎵', label: 'Music' },
  { value: '🎬', label: 'Film' },
  { value: '📷', label: 'Camera' },
  // Nature / Elements
  { value: '🌿', label: 'Plant' },
  { value: '🌱', label: 'Sprout' },
  { value: '⚡', label: 'Lightning' },
  { value: '🔥', label: 'Fire' },
  { value: '💧', label: 'Water' },
  { value: '🌙', label: 'Moon' },
  { value: '⭐', label: 'Star' },
  // Misc
  { value: '🏠', label: 'Home' },
  { value: '🔑', label: 'Key' },
  { value: '📌', label: 'Pin' },
  { value: '🎁', label: 'Gift' },
  { value: '🏆', label: 'Trophy' },
  { value: '💬', label: 'Chat' },
  { value: '🗓️', label: 'Calendar' },
  { value: '🔗', label: 'Link' },
];

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
