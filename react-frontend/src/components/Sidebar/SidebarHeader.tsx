import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface SidebarHeaderProps {
  displayName: string;
  onToggleCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ displayName, onToggleCollapse }) => {
  return (
    <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100 dark:border-dark-border">
      <div className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">{displayName}</div>
      <button
        onClick={onToggleCollapse}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
        aria-label="Collapse sidebar"
      >
        <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
      </button>
    </div>
  );
};

export default SidebarHeader;
