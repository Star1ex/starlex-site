import React from 'react';
import SidebarSection from './SidebarSection.js';

export const TasksSection: React.FC = () => {
  return <SidebarSection title="TASKS" type="tasks" defaultExpanded />;
};

export default TasksSection;
