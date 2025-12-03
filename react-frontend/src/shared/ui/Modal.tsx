import React, { ReactNode, useEffect } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = ({ open, onClose, children }: Props) => {
  useEffect(() => { 
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-md bg-[#F3E6DE] shadow-xl relative">
          <button
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 text-[#7b5a4f] text-xl"
          >
            ×
          </button>
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
};
