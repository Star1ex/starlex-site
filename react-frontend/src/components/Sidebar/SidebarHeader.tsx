import React from 'react';
import { Home, PanelLeftClose } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarHeaderProps {
  onToggleCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/dashboard';

  return (
    <div className="flex items-center justify-between px-2 pt-3 pb-2">
      <button
        onClick={() => navigate('/dashboard')}
        className={`flex items-center gap-2.5 flex-1 px-2 py-2 rounded-md transition-colors text-left ${
          isHome
            ? 'text-gray-900 dark:text-dark-text'
            : 'text-gray-600 dark:text-dark-text-muted hover:text-gray-900 dark:hover:text-dark-text'
        }`}
      >
        <Home size={17} className="flex-shrink-0" />
        <span className="text-sm font-semibold">Home</span>
      </button>
      <button
        onClick={onToggleCollapse}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-dark-border transition-colors flex-shrink-0"
        aria-label="Collapse sidebar"
      >
        <PanelLeftClose size={15} className="text-gray-400 dark:text-dark-text-muted" />
      </button>
    </div>
  );
};

export default SidebarHeader;
