import React from 'react';

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, danger = false }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border'
      }`}
    >
      {icon && <div className="w-4 h-4 flex items-center justify-center">{icon}</div>}
      <span className="flex-1">{label}</span>
    </button>
  );
};

export default MenuItem;
