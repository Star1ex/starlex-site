import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FolderDTO, TaskDTO, CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import InlineEdit from '@/components/shared/InlineEdit.js';
import TaskItem from './TaskItem.js';
import { taskService } from '@/services/api/index.js';

interface FolderItemProps {
  folder: FolderDTO;
  level: number;
  getSubfolders: (parentId: string) => FolderDTO[];
  getFolderTasks: (folderId: string) => TaskDTO[];
  onUpdateFolder: (id: string, data: Partial<CreateFolderRequest>) => Promise<any>;
  onDeleteFolder: (id: string) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<CreateTaskRequest>) => Promise<any>;
  removingFolderIds?: Record<string, boolean>;
  removingTaskIds?: Record<string, boolean>;
}

export const FolderItem: React.FC<FolderItemProps> = React.memo(({ folder, level, getSubfolders, getFolderTasks, onUpdateFolder, onDeleteFolder, onUpdateTask, removingFolderIds = {}, removingTaskIds = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const navigate = useNavigate();
  const { openContextMenu } = useContextMenu();

  const subfolders = useMemo(() => getSubfolders(folder.id), [getSubfolders, folder.id]);
  const tasksFromStore = useMemo(() => getFolderTasks(folder.id), [getFolderTasks, folder.id]);
  const [folderTasks, setFolderTasks] = useState<TaskDTO[]>(tasksFromStore);
  const hasChildren = subfolders.length > 0 || folderTasks.length > 0;

  useEffect(() => {
    const onRename = (event: Event) => {
      const ev = event as CustomEvent;
      if (ev?.detail?.type === 'folder' && ev?.detail?.id === folder.id) {
        setIsRenaming(true);
      }
    };

    window.addEventListener('sidebarRename', onRename as EventListener);
    return () => window.removeEventListener('sidebarRename', onRename as EventListener);
  }, [folder.id]);

  useEffect(() => {
    setFolderTasks(tasksFromStore);
  }, [tasksFromStore]);

  useEffect(() => {
    let mounted = true;
    const loadFolderTasks = async () => {
      if (!isExpanded) return;
      try {
        const data = await taskService.getTasksByFolder(folder.id);
        if (mounted) setFolderTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load folder tasks:', err);
      }
    };

    loadFolderTasks();

    const onTaskCreated = () => loadFolderTasks();
    window.addEventListener('personalTaskCreated', onTaskCreated);
    return () => {
      mounted = false;
      window.removeEventListener('personalTaskCreated', onTaskCreated);
    };
  }, [folder.id, isExpanded]);

  const handleRename = useCallback(async (newName: string) => {
    await onUpdateFolder(folder.id, { name: newName });
    setIsRenaming(false);
  }, [folder.id, onUpdateFolder]);

  const paddingLeft = level * 12 + 8;
  const isRemoving = !!removingFolderIds[folder.id];
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);
  const handleOpenContextMenu = useCallback((e: React.MouseEvent) => {
    openContextMenu(e, { type: 'folder', folderId: folder.id });
  }, [openContextMenu, folder.id]);
  const handleNavigate = useCallback(() => {
    navigate(`/personal?folder=${folder.id}`);
  }, [navigate, folder.id]);

  return (
    <div className={`transition-all duration-200 ${isRemoving ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
      <div
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md cursor-pointer group transition-colors"
        style={{ paddingLeft }}
        onClick={handleToggleExpand}
        onContextMenu={handleOpenContextMenu}
      >
        {hasChildren ? (
          <ChevronRight
            className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <div className="w-3" />
        )}

        <svg className="w-4 h-4 flex-shrink-0" style={{ color: folder.color || '#6B7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>

        {isRenaming ? (
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
            <InlineEdit
              value={folder.name}
              onSave={handleRename}
              onCancel={() => setIsRenaming(false)}
              onChange={(value) => {
                window.dispatchEvent(new CustomEvent('personalFolderNameChange', { detail: { id: folder.id, name: value } }));
              }}
              className="w-full text-sm bg-transparent border-0 outline-none p-0 focus:outline-none"
            />
          </div>
        ) : (
          <span
            className="text-sm text-gray-700 dark:text-dark-text truncate flex-1"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
          >
            {folder.name}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenContextMenu(e);
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-opacity flex-shrink-0"
          title="Folder actions"
        >
          <MoreVertical className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {isExpanded && hasChildren && !isRemoving && (
        <div className="space-y-0.5" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 200px' }}>
          {subfolders.map((subfolder) => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              getSubfolders={getSubfolders}
              getFolderTasks={getFolderTasks}
              onUpdateFolder={onUpdateFolder}
              onDeleteFolder={onDeleteFolder}
              onUpdateTask={onUpdateTask}
              removingFolderIds={removingFolderIds}
              removingTaskIds={removingTaskIds}
            />
          ))}
          {folderTasks.map((task) => (
            <TaskItem key={task.id} task={task} level={level + 1} onUpdateTask={onUpdateTask} isRemoving={!!removingTaskIds[task.id]} />
          ))}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.folder.id === next.folder.id &&
    prev.folder.name === next.folder.name &&
    prev.folder.color === next.folder.color &&
    prev.folder.parent_id === next.folder.parent_id &&
    prev.folder.updated_at === next.folder.updated_at &&
    prev.level === next.level
  );
});

export default FolderItem;
