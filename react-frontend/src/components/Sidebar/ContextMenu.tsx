import React from 'react';
import { Edit2, FilePlus, FolderPlus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import type { CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';

interface ContextMenuProps {
  onCreateFolder: (data: CreateFolderRequest) => Promise<any>;
  onCreateTask: (data: CreateTaskRequest) => Promise<any>;
  onDeleteFolder: (id: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ onCreateFolder, onCreateTask, onDeleteFolder, onDeleteTask }) => {
  const { contextMenu, closeContextMenu } = useContextMenu();
  const { userId } = useAuth();
  const resolveOwnerId = () => {
    const storedUser = getAuthUser();
    return userId ?? storedUser?.id ?? '';
  };

  if (!contextMenu.show) return null;

  const handleNewTask = async () => {
    if (!contextMenu.folderId) return;
    const ownerId = resolveOwnerId();
    await onCreateTask({
      task: 'New Task',
      description: '',
      priority: 'medium',
      progress: 'not_started',
      folder_id: contextMenu.folderId,
      owner_id: ownerId,
      team_id: null,
      user_ids: [],
    });
    closeContextMenu();
  };

  const handleNewSubfolder = async () => {
    if (!contextMenu.folderId) return;
    const ownerId = resolveOwnerId();
    await onCreateFolder({
      name: 'New Subfolder',
      icon: '📁',
      color: '#3B82F6',
      parent_id: contextMenu.folderId,
      owner_id: ownerId,
      team_id: null,
      position: 0,
    });
    closeContextMenu();
  };

  const handleNewRootFolder = async () => {
    const ownerId = resolveOwnerId();
    await onCreateFolder({
      name: 'New Folder',
      icon: '📁',
      color: '#3B82F6',
      parent_id: null,
      owner_id: ownerId,
      team_id: null,
      position: 0,
    });
    closeContextMenu();
  };

  const handleNewOrphanTask = async () => {
    const ownerId = resolveOwnerId();
    await onCreateTask({
      task: 'New Task',
      description: '',
      priority: 'medium',
      progress: 'not_started',
      folder_id: null,
      owner_id: ownerId,
      team_id: null,
      user_ids: [],
    });
    closeContextMenu();
  };

  const handleRename = () => {
    if (contextMenu.type === 'folder' && contextMenu.folderId) {
      window.dispatchEvent(new CustomEvent('sidebarRename', { detail: { type: 'folder', id: contextMenu.folderId } }));
    }
    if (contextMenu.type === 'task' && contextMenu.taskId) {
      window.dispatchEvent(new CustomEvent('sidebarRename', { detail: { type: 'task', id: contextMenu.taskId } }));
    }
    closeContextMenu();
  };

  const handleDelete = async () => {
    if (contextMenu.type === 'folder' && contextMenu.folderId) {
      await onDeleteFolder(contextMenu.folderId);
    }
    if (contextMenu.type === 'task' && contextMenu.taskId) {
      await onDeleteTask(contextMenu.taskId);
    }
    closeContextMenu();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={closeContextMenu} />

      <div
        className="fixed z-50 bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border py-1 min-w-[200px]"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {contextMenu.type === 'folder' && (
          <>
            <MenuItem icon={<FilePlus className="w-4 h-4" />} label="New Task" onClick={handleNewTask} />
            <MenuItem icon={<FolderPlus className="w-4 h-4" />} label="New Subfolder" onClick={handleNewSubfolder} />
            <Divider />
            <MenuItem icon={<Edit2 className="w-4 h-4" />} label="Rename" onClick={handleRename} />
            <Divider />
            <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={handleDelete} danger />
          </>
        )}

        {contextMenu.type === 'task' && (
          <>
            <MenuItem icon={<Edit2 className="w-4 h-4" />} label="Rename" onClick={handleRename} />
            <Divider />
            <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={handleDelete} danger />
          </>
        )}

        {contextMenu.type === 'root' && (
          <>
            <MenuItem icon={<FilePlus className="w-4 h-4" />} label="New Task" onClick={handleNewOrphanTask} />
            <MenuItem icon={<FolderPlus className="w-4 h-4" />} label="New Folder" onClick={handleNewRootFolder} />
          </>
        )}
      </div>
    </>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }> = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border transition-colors ${
      danger ? 'text-red-600' : 'text-gray-700 dark:text-dark-text'
    }`}
  >
    <span className="w-4 h-4">{icon}</span>
    <span>{label}</span>
  </button>
);

const Divider = () => <div className="h-px bg-gray-200 dark:bg-dark-border my-1" />;

export default ContextMenu;
