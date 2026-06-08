import React from 'react';
import { Search } from 'lucide-react';

interface TopbarProps {
  onSearchOpen?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearchOpen }) => {
  return (
    <header className="app-topbar px-6">
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={onSearchOpen}
          className="w-full max-w-2xl flex items-center gap-3 glass-input !rounded-full !py-2.5 text-white/40 hover:text-white/60 transition-colors cursor-pointer"
          aria-label="Open command palette"
        >
          <Search size={15} className="flex-shrink-0 ml-1" />
          <span className="flex-1 text-left text-body-md">Search or jump to…</span>
          <span className="glass-pill !py-0.5 !px-2 text-white/40 flex-shrink-0">⌘K</span>
        </button>
      </div>
    </header>
  );
};
