import React, { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useOutsideClick from '@/shared/hooks/useOutsideClick.js';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children?: React.ReactNode;
}

const ContextMenu: React.FC<ContextMenuProps> = React.memo(({ x, y, onClose, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // delay activation to avoid immediate close from the originating right-click event
  const listenersActiveRef = React.useRef(false);
  React.useEffect(() => {
    const t = setTimeout(() => { listenersActiveRef.current = true; }, 0);
    return () => clearTimeout(t);
  }, []);

  useOutsideClick(ref, (e) => { if (listenersActiveRef.current) onClose(); }, listenersActiveRef.current);

  const handleEsc = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape' && listenersActiveRef.current) onClose(); }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [handleEsc]);
  return createPortal(
    <div ref={ref} className="context-menu" style={{ position: 'fixed', top: `${y}px`, left: `${x}px`, zIndex: 10001 }}>
      <div className="min-w-[180px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-xl py-1">
        {children}
      </div>
    </div>,
    document.body
  );
});

ContextMenu.displayName = 'ContextMenu';
export default ContextMenu;
