import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FolderDTO, TaskDTO, CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import InlineEdit from '@/components/shared/InlineEdit.js';
import TaskItem from './TaskItem.js';
import { taskService } from '@/services/api/index.js';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface FolderItemProps {
  folder: FolderDTO;
  level: number;
  getSubfolders: (parentId: string) => FolderDTO[];
  getFolderTasks: (folderId: string) => TaskDTO[];
  onUpdateFolder: (id: string, data: Partial<CreateFolderRequest>) => Promise<any>;
  onDeleteFolder: (id: string) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<CreateTaskRequest>) => Promise<any>;
  savingFolderIds?: Record<string, boolean>;
  recentFolderIds?: Record<string, boolean>;
  recentTaskIds?: Record<string, boolean>;
  removingFolderIds?: Record<string, boolean>;
  removingTaskIds?: Record<string, boolean>;
}

export const FolderItem: React.FC<FolderItemProps> = React.memo(({ folder, level, getSubfolders, getFolderTasks, onUpdateFolder, onDeleteFolder, onUpdateTask, savingFolderIds = {}, recentFolderIds = {}, recentTaskIds = {}, removingFolderIds = {}, removingTaskIds = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savingRenameRef = useRef(false);
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
    if (savingRenameRef.current) return;
    savingRenameRef.current = true;
    const previousName = folder.name || 'Untitled';
    try {
      await onUpdateFolder(folder.id, { name: newName });
      setShowSaved(true);
      window.setTimeout(() => setShowSaved(false), 700);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('personalFolderNameChange', { detail: { id: folder.id, name: previousName } }));
    } finally {
      setIsRenaming(false);
      savingRenameRef.current = false;
    }
  }, [folder.id, folder.name, onUpdateFolder]);

  const paddingLeft = level * 12 + 8;
  const isRemoving = !!removingFolderIds[folder.id];
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-folder-${folder.id}`,
    data: { type: 'folder', id: folder.id },
  });
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );
  const dragStyle = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);
  const isSaving = !!savingFolderIds[folder.id] || folder.id.startsWith('temp-');
  const isRecent = !!recentFolderIds[folder.id];
  const [isFresh, setIsFresh] = useState(folder.id.startsWith('temp-') || isRecent);

  const handleOpenContextMenu = useCallback((e: React.MouseEvent) => {
    if (isSaving) return;
    openContextMenu(e, { type: 'folder', folderId: folder.id });
  }, [openContextMenu, folder.id, isSaving]);
  const handleNavigate = useCallback(() => {
    navigate(`/personal?folder=${folder.id}`);
  }, [navigate, folder.id]);

  useEffect(() => {
    if (folder.id.startsWith('temp-') || isRecent) {
      setIsFresh(true);
      const timer = window.setTimeout(() => {
        setIsFresh(false);
      }, 60);
      return () => window.clearTimeout(timer);
    }
    return;
  }, [folder.id, isRecent]);

  useEffect(() => {
    if (isExpanded) return;
    if (subfolders.some((subfolder) => subfolder.id.startsWith('temp-'))) {
      setIsExpanded(true);
    }
  }, [subfolders, isExpanded]);

  const shouldRenderChildren = hasChildren && !isRemoving;

  return (
    <div
      className={`transition-all duration-200 will-change-transform ${
        isRemoving ? 'opacity-0 -translate-y-1 scale-95 pointer-events-none' : isFresh ? 'opacity-0 -translate-y-1 scale-95' : 'opacity-100 translate-y-0 scale-100'
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <div
        ref={setRefs}
        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer group transition-colors ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700' : 'hover:bg-gray-100 dark:hover:bg-dark-border'
        }`}
        style={{ paddingLeft, ...(dragStyle || {}) }}
        onClick={handleToggleExpand}
        onContextMenu={handleOpenContextMenu}
        {...attributes}
        {...listeners}
      >
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

        {showSaved && (
          <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        )}

        {hasChildren ? (
          <ChevronRight
            className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-all duration-200 ease-in-out opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 ${isExpanded ? 'rotate-90' : ''}`}
          />
        ) : (
          <div className="w-3 h-3 flex-shrink-0 opacity-0" />
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenContextMenu(e);
          }}
          className={`p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition-opacity duration-200 flex-shrink-0 ${
            isSaving ? 'pointer-events-none opacity-40' : ''
          }`}
          title="Folder actions"
        >
          <MoreVertical className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      <div
        className="folder-children space-y-0.5"
        data-state={isExpanded && shouldRenderChildren ? 'open' : 'closed'}
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 200px' }}
        aria-hidden={!isExpanded || !hasChildren}
      >
        {shouldRenderChildren && (
          <>
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
                savingFolderIds={savingFolderIds}
                recentFolderIds={recentFolderIds}
                recentTaskIds={recentTaskIds}
                removingFolderIds={removingFolderIds}
                removingTaskIds={removingTaskIds}
              />
            ))}
            {folderTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                level={level + 1}
                onUpdateTask={onUpdateTask}
                isRemoving={!!removingTaskIds[task.id]}
                recentTaskIds={recentTaskIds}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  const prevRemoving = prev.removingFolderIds?.[prev.folder.id] ?? false;
  const nextRemoving = next.removingFolderIds?.[next.folder.id] ?? false;
  const prevSaving = prev.savingFolderIds?.[prev.folder.id] ?? false;
  const nextSaving = next.savingFolderIds?.[next.folder.id] ?? false;
  const prevRecent = prev.recentFolderIds?.[prev.folder.id] ?? false;
  const nextRecent = next.recentFolderIds?.[next.folder.id] ?? false;
  return (
    prev.folder.id === next.folder.id &&
    prev.folder.name === next.folder.name &&
    prev.folder.color === next.folder.color &&
    prev.folder.parent_id === next.folder.parent_id &&
    prev.folder.updated_at === next.folder.updated_at &&
    prev.level === next.level &&
    prev.getSubfolders === next.getSubfolders &&
    prev.getFolderTasks === next.getFolderTasks &&
    prev.removingFolderIds === next.removingFolderIds &&
    prev.removingTaskIds === next.removingTaskIds &&
    prev.recentTaskIds === next.recentTaskIds &&
    prevRemoving === nextRemoving &&
    prevSaving === nextSaving &&
    prevRecent === nextRecent
  );
});

export default FolderItem;
