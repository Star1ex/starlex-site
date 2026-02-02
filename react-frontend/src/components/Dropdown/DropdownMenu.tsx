import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

interface DropdownMenuProps {
  children: React.ReactNode;
  anchorEl: React.RefObject<HTMLElement>;
  onClose: () => void;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, anchorEl, onClose, position = 'bottom-left' }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorEl.current) return;

    const updatePosition = () => {
      const anchor = anchorEl.current!.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom-left':
          top = anchor.bottom + 6;
          left = anchor.left;
          break;
        case 'bottom-right':
          top = anchor.bottom + 6;
          left = anchor.right - (menuRef.current?.offsetWidth || 0);
          break;
        case 'top-left':
          top = anchor.top - (menuRef.current?.offsetHeight || 0) - 6;
          left = anchor.left;
          break;
        case 'top-right':
          top = anchor.top - (menuRef.current?.offsetHeight || 0) - 6;
          left = anchor.right - (menuRef.current?.offsetWidth || 0);
          break;
        default:
          top = anchor.bottom + 6;
          left = anchor.left;
      }

      setMenuPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl, position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !anchorEl.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorEl]);

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      className="dropdown-menu"
      style={{ position: 'fixed', top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, zIndex: 9999 }}
    >
      {children}
    </div>,
    document.body
  );
};

export default DropdownMenu;
