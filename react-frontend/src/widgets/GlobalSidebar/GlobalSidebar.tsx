import React from 'react';
import Sidebar from '@/components/Sidebar/Sidebar.js';

interface GlobalSidebarProps {
  className?: string;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ className = '' }) => {
  return <Sidebar className={className} />;
};

export default GlobalSidebar;
