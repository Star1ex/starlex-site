import React from 'react';
import { Search } from 'lucide-react';
import { Glass } from '@/shared/ui/glass/index.js';

interface TopbarProps {
  onSearchOpen?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearchOpen }) => {
  return (
    <header className="app-topbar">
      <div className="flex-1 flex items-center justify-center">
        <Glass
          as="button"
          variant="pill"
          interactive
          onClick={onSearchOpen}
          className="topbar-search"
          aria-label="Open command palette"
        >
          <Search size={15} strokeWidth={1.55} className="flex-shrink-0" />
          <span className="flex-1 text-left">Search or jump to…</span>
          <span className="topbar-search-kbd label-caps">⌘K</span>
        </Glass>
      </div>
    </header>
  );
};
