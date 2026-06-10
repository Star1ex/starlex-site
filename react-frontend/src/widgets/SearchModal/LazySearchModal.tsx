import React, { Suspense } from 'react';
import { createPortal } from 'react-dom';
import type { SearchModalProps } from './SearchModal.js';

const SearchModal = React.lazy(() => import('./SearchModal.js'));

function SearchModalLoading({ onClose }: Pick<SearchModalProps, 'onClose'>) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      <div
        className="absolute inset-0"
        style={{ background: 'var(--sx-overlay)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="relative w-full overflow-hidden search-modal-surface"
        style={{
          maxWidth: '560px',
          minHeight: '4rem',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          boxShadow: 'var(--sx-shadow-elevated)',
          margin: '0 16px',
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="h-4 w-4 rounded-full bg-[color:var(--sx-control)] animate-pulse" />
          <div className="h-3 flex-1 rounded-full bg-[color:var(--sx-control)] animate-pulse" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function LazySearchModal(props: SearchModalProps) {
  if (!props.isOpen) return null;

  return (
    <Suspense fallback={<SearchModalLoading onClose={props.onClose} />}>
      <SearchModal {...props} />
    </Suspense>
  );
}
