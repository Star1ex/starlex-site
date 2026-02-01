import React from 'react';
import { PersonalTasksSection } from '@/components/PersonalTasks/index.js';
import { PersonalTasksProvider } from '@/contexts/PersonalTasksContext.js';

export default function PersonalTasksPage() {
  return (
    <PersonalTasksProvider>
      <PersonalTasksSection />
    </PersonalTasksProvider>
  );
}
