import React, { useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useOutsideClick from '@/shared/hooks/useOutsideClick.js';

interface DropdownMenuProps {
  children: React.ReactNode;
  anchorEl: React.RefObject<HTMLElement>;
  onClose: () => void;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = React.memo(({ children, anchorEl, onClose, position = 'bottom-left' }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const computePosition = useCallback(() => {
    const anchor = anchorEl.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const a = anchor.getBoundingClientRect();
    let top = 0;
    let left = 0;

    const menuW = menu.offsetWidth || 0;
    const menuH = menu.offsetHeight || 0;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    switch (position) {
      case 'bottom-left':
        top = a.bottom + 6;
        left = a.left;
        break;
      case 'bottom-right':
        top = a.bottom + 6;
        left = a.right - menuW;
        break;
      case 'top-left':
        top = a.top - menuH - 6;
        left = a.left;
        break;
      case 'top-right':
        top = a.top - menuH - 6;
        left = a.right - menuW;
        break;
      default:
        top = a.bottom + 6;
        left = a.left;
    }

    // Clamp inside viewport with 8px padding
    top = Math.max(8, Math.min(top, viewportH - menuH - 8));
    left = Math.max(8, Math.min(left, viewportW - menuW - 8));

    setMenuPosition((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
  }, [anchorEl, position]);

  // RAF-throttled update
  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      computePosition();
      rafRef.current = null;
    });
  }, [computePosition]);

  useLayoutEffect(() => {
    // Initial sync
    computePosition();
  }, [computePosition]);

  React.useEffect(() => {
    window.addEventListener('resize', scheduleUpdate);
    document.addEventListener('scroll', scheduleUpdate, true);

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      document.removeEventListener('scroll', scheduleUpdate, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleUpdate]);

  const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
    const target = event.target as Node;
    if (
      menuRef.current &&
      !menuRef.current.contains(target) &&
      !anchorEl.current?.contains(target)
    ) {
      onClose();
    }
  }, [onClose, anchorEl]);

  useOutsideClick(menuRef, handleClickOutside);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  }, [onClose]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleEscape]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-expanded
      tabIndex={-1}
      className="dropdown-menu"
      style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 9999 }}
    >
      {children}
    </div>,
    document.body
  );
});

DropdownMenu.displayName = 'DropdownMenu';

export default DropdownMenu;
