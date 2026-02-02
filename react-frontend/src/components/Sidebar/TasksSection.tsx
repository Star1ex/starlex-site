import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderService, taskService } from '@/services/api/index.js';
import type { FolderDTO, TaskDTO } from '@/types/dto.js';
import FolderItem from './FolderItem.js';
import TaskItem from './TaskItem.js';
import FolderInlineCreate from './FolderInlineCreate.js';

export const TasksSection: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [inlineCreateParent, setInlineCreateParent] = useState<string | null | 'root'>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [foldersData, tasksData] = await Promise.all([
        folderService.getUserFolders(),
        taskService.getPersonalTasks(),
      ]);

      // Include both null and empty string team ids as personal
      setFolders(Array.isArray(foldersData) ? (foldersData.filter((f:any) => f.team_id == null || f.team_id === '')) : []);
      setTasks(Array.isArray(tasksData) ? (tasksData.filter((t:any) => t.team_id == null || t.team_id === '')) : []);
    } catch (error) {
      console.error('Failed to load tasks data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('personalTaskCreated', handleRefresh);
    window.addEventListener('personalFolderCreated', handleRefresh);
    return () => {
      window.removeEventListener('personalTaskCreated', handleRefresh);
      window.removeEventListener('personalFolderCreated', handleRefresh);
    };
  }, [loadData]);

  const toggleFolder = React.useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
      return next;
    });
  }, []);

  const renderFolder = React.useCallback((folder: FolderDTO, level = 0): React.ReactNode => {
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
  }, [folders, tasks, expandedFolders, navigate, toggleFolder]);

  const rootFolders = React.useMemo(() => folders.filter(f => f.parent_id == null).sort((a,b) => (a.name || '').localeCompare(b.name || '')), [folders]);
  const tasksWithoutFolder = React.useMemo(() => tasks.filter(t => t.folder_id == null).sort((a,b) => (a.task || '').localeCompare(b.task || '')), [tasks]);

  const handleCreateTask = React.useCallback(() => {
    navigate('/task/new');
  }, [navigate]);

  const handleCreateFolder = React.useCallback(() => {
    // show inline create at root
    setInlineCreateParent('root');
  }, []);

  return (
    <div className="tasks-section">
      <div className="space-y-0.5">
        <div className="pr-1">
          {rootFolders.map(folder => renderFolder(folder, 0))}

          {/* New Folder quick action - appears below folders, above standalone tasks */}
          <div className="px-0">
            {inlineCreateParent === 'root' ? (
              <div className="px-1">
                <FolderInlineCreate parentId={null} onClose={() => setInlineCreateParent(null)} />
              </div>
            ) : (
              <div className="px-1">
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleCreateFolder(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors text-left"
                  style={{ minHeight: '36px' }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  <span className="truncate flex-1">New Folder</span>
                </button>
              </div>
            )}
          </div>

          {tasksWithoutFolder.length > 0 && (
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Orphan Tasks</div>
              <div className="space-y-2">
                {tasksWithoutFolder.map(task => (
                  <TaskItem key={task.id} task={task} level={0} onNavigate={() => navigate(`/task/${task.id}`)} />
                ))}
              </div>
            </div>
          )}

          {rootFolders.length === 0 && tasksWithoutFolder.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-gray-400 dark:text-dark-text-muted">No tasks yet</p>
              <button onClick={handleCreateTask} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">Create your first task</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TasksSection.displayName = 'TasksSection';
export default TasksSection;
