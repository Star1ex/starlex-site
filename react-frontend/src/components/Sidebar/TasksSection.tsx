import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderService, taskService } from '@/services/api/index.js';
import type { FolderDTO, TaskDTO } from '@/types/dto.js';
import FolderItem from './FolderItem.js';
import TaskItem from './TaskItem.js';
import DropdownMenu from '@/components/Dropdown/DropdownMenu.js';
import MenuItem from '@/components/Dropdown/MenuItem.js';

export const TasksSection: React.FC = () => {
  const navigate = useNavigate();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const loadData = async () => {
    try {
      const [foldersData, tasksData] = await Promise.all([
        folderService.getUserFolders(),
        taskService.getPersonalTasks(),
      ]);

      setFolders(Array.isArray(foldersData) ? (foldersData.filter((f:any) => f.team_id === null)) : []);
      setTasks(Array.isArray(tasksData) ? (tasksData.filter((t:any) => t.team_id === null)) : []);
    } catch (error) {
      console.error('Failed to load tasks data:', error);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('personalTaskCreated', handleRefresh);
    window.addEventListener('personalFolderCreated', handleRefresh);
    return () => {
      window.removeEventListener('personalTaskCreated', handleRefresh);
      window.removeEventListener('personalFolderCreated', handleRefresh);
    };
  }, []);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
      return next;
    });
  };

  const renderFolder = (folder: FolderDTO, level = 0) => {
    const subfolders = folders.filter(f => f.parent_id === folder.id);
    const folderTasks = tasks.filter(t => t.folder_id === folder.id);
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = subfolders.length > 0 || folderTasks.length > 0;

    return (
      <div key={folder.id}>
        <FolderItem
          folder={folder}
          level={level}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onToggle={() => toggleFolder(folder.id)}
          onNavigate={() => navigate(`/personal?folder=${folder.id}`)}
        />

        {isExpanded && (
          <div>
            {subfolders.map(sf => renderFolder(sf, level + 1))}
            {folderTasks.map(task => (
              <TaskItem key={task.id} task={task} level={level + 1} onNavigate={() => navigate(`/task/${task.id}`)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(f => f.parent_id === null).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  const tasksWithoutFolder = tasks.filter(t => t.folder_id === null).sort((a,b) => (a.task || '').localeCompare(b.task || ''));

  const handleCreateTask = () => {
    setIsAddMenuOpen(false);
    navigate('/task/new');
  };

  const handleCreateFolder = () => {
    setIsAddMenuOpen(false);
    window.dispatchEvent(new CustomEvent('openPersonalFolderCreate'));
  };

  return (
    <div className="tasks-section">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 mb-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">Tasks</span>
        <button
          ref={addButtonRef}
          onClick={() => setIsAddMenuOpen(s => !s)}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-border transition-colors opacity-0 group-hover:opacity-100"
          title="Create"
        >
          <svg className="w-3 h-3 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        {isAddMenuOpen && (
          <DropdownMenu anchorEl={addButtonRef as any} onClose={() => setIsAddMenuOpen(false)} position="bottom-left">
            <MenuItem label="New Task" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} onClick={handleCreateTask} />
            <MenuItem label="New Folder" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>} onClick={handleCreateFolder} />
          </DropdownMenu>
        )}
      </div>

      <div className="space-y-0.5">
        {rootFolders.map(folder => renderFolder(folder, 0))}

        {tasksWithoutFolder.map(task => (
          <TaskItem key={task.id} task={task} level={0} onNavigate={() => navigate(`/task/${task.id}`)} />
        ))}

        {rootFolders.length === 0 && tasksWithoutFolder.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-gray-400 dark:text-dark-text-muted">No tasks yet</p>
            <button onClick={handleCreateTask} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">Create your first task</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksSection;
