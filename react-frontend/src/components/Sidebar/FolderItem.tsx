import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FolderDTO, TaskDTO, CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import InlineEdit from '@/components/shared/InlineEdit.js';
import TaskItem from './TaskItem.js';

interface FolderItemProps {
  folder: FolderDTO;
  level: number;
  getSubfolders: (parentId: string) => FolderDTO[];
  getFolderTasks: (folderId: string) => TaskDTO[];
  onUpdateFolder: (id: string, data: Partial<CreateFolderRequest>) => Promise<any>;
  onDeleteFolder: (id: string) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<CreateTaskRequest>) => Promise<any>;
}

export const FolderItem: React.FC<FolderItemProps> = ({ folder, level, getSubfolders, getFolderTasks, onUpdateFolder, onDeleteFolder, onUpdateTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const navigate = useNavigate();
  const { openContextMenu } = useContextMenu();

  const subfolders = useMemo(() => getSubfolders(folder.id), [getSubfolders, folder.id]);
  const tasks = useMemo(() => getFolderTasks(folder.id), [getFolderTasks, folder.id]);
  const hasChildren = subfolders.length > 0 || tasks.length > 0;

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

  const handleRename = async (newName: string) => {
    await onUpdateFolder(folder.id, { name: newName });
    setIsRenaming(false);
  };

  const paddingLeft = level * 12 + 8;

  return (
    <div>
      <div
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md cursor-pointer group transition-colors"
        style={{ paddingLeft }}
        onClick={() => setIsExpanded(!isExpanded)}
        onContextMenu={(e) => openContextMenu(e, { type: 'folder', folderId: folder.id })}
      >
        {hasChildren ? (
          <ChevronRight
            className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <div className="w-3" />
        )}

        <span className="text-base flex-shrink-0">{folder.icon || ''}</span>

        {isRenaming ? (
          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
            <InlineEdit
              value={folder.name}
              onSave={handleRename}
              onCancel={() => setIsRenaming(false)}
              className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
            />
          </div>
        ) : (
          <span
            className="text-sm text-gray-700 dark:text-dark-text truncate flex-1"
            onDoubleClick={() => navigate(`/personal?folder=${folder.id}`)}
          >
            {folder.name}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            openContextMenu(e, { type: 'folder', folderId: folder.id });
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-opacity flex-shrink-0"
          title="Folder actions"
        >
          <MoreVertical className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {isExpanded && hasChildren && (
        <div className="space-y-0.5">
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
            />
          ))}
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} level={level + 1} onUpdateTask={onUpdateTask} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderItem;
