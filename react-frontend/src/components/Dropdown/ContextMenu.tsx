import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

    // Delay to avoid immediate close from the original right-click event
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }, 0);

    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div ref={ref} className="context-menu" style={{ position: 'fixed', top: `${y}px`, left: `${x}px`, zIndex: 10001 }}>
      <div className="min-w-[180px] bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-xl py-1">
        {children}
      </div>
    </div>,
    document.body
  );
}
