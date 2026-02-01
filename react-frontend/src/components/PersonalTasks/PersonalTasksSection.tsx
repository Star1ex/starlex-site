import React from 'react';
import { usePersonalTasks } from '../../contexts/PersonalTasksContext.js';
import FolderList from './FolderList.js';
import TaskList from './TaskList.js';

export default function PersonalTasksSection() {
  const { isLoading, folders, tasks, openCreateTask, openCreateFolder } = usePersonalTasks();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Personal Tasks</h2>
        <div className="flex items-center gap-2">
          <button onClick={openCreateFolder} className="px-2 py-1 bg-white border rounded text-sm">New Folder</button>
          <button onClick={openCreateTask} className="px-3 py-1 bg-black text-white rounded text-sm">New Task</button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading personal tasks…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <FolderList folders={folders} />
          </div>
          <div className="md:col-span-2">
            <TaskList tasks={tasks} />
          </div>
        </div>
      )}
    </div>
  );
}
