import React, { useCallback, useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import FolderItem from './FolderItem.js';
import TaskItem from './TaskItem.js';
import { useFolders } from '@/hooks/useFolders.js';
import { useTasks } from '@/hooks/useTasks.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { FolderDTO, TaskDTO } from '@/types/dto.js';
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';

interface SidebarSectionProps {
  title: string;
  type: 'teams' | 'tasks';
  defaultExpanded?: boolean;
  teams?: Array<{ id: string; name: string }>;
  loadingTeams?: boolean;
  onTeamClick?: (teamId: string) => void;
  onAddTeam?: () => void;
  activeTeamId?: string | null;
  foldersHook?: ReturnType<typeof useFolders>;
  tasksHook?: ReturnType<typeof useTasks>;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  type,
  defaultExpanded = true,
  teams = [],
  loadingTeams = false,
  onTeamClick,
  onAddTeam,
  activeTeamId,
  foldersHook: foldersHookProp,
  tasksHook: tasksHookProp,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { userId } = useAuth();
  const foldersHook = foldersHookProp || useFolders();
  const tasksHook = tasksHookProp || useTasks();
  const { openContextMenu } = useContextMenu();

  const rootFolders = useMemo(
    () => [...foldersHook.rootFolders].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [foldersHook.rootFolders],
  );
  const orphanTasks = useMemo(
    () => [...tasksHook.orphanTasks].sort((a, b) => (a.task || '').localeCompare(b.task || '')),
    [tasksHook.orphanTasks],
  );
  const removingFolderIds = foldersHook.removingFolderIds || {};
  const removingTaskIds = tasksHook.removingTaskIds || {};
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { setNodeRef: setRootDropRef, isOver: isRootOver } = useDroppable({
    id: 'drop-root',
    data: { type: 'root' },
  });

  const parentById = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const f of foldersHook.folders) {
      map.set(f.id, f.parent_id ?? null);
    }
    return map;
  }, [foldersHook.folders]);

  const isDescendant = useCallback(
    (folderId: string, potentialAncestorId: string) => {
      let current: string | null | undefined = parentById.get(folderId);
      while (current) {
        if (current === potentialAncestorId) return true;
        current = parentById.get(current);
      }
      return false;
    },
    [parentById]
  );

  const handleDragEnd = useCallback(
    async (event: any) => {
      const active = event.active?.data?.current;
      const over = event.over?.data?.current;
      if (!active || !over) return;

      if (active.type === 'task') {
        if (over.type === 'folder') {
          await tasksHook.moveTaskToFolder(active.id, over.id);
        }
        if (over.type === 'root') {
          await tasksHook.moveTaskToFolder(active.id, null);
        }
        return;
      }

      if (active.type === 'folder') {
        if (over.type === 'folder') {
          if (active.id === over.id) return;
          if (isDescendant(over.id, active.id)) return;
          await foldersHook.moveFolder(active.id, over.id);
        }
        if (over.type === 'root') {
          await foldersHook.moveFolder(active.id, null);
        }
      }
    },
    [foldersHook, tasksHook, isDescendant]
  );

  const handleAddNew = useCallback(async () => {
    if (type === 'teams') {
      onAddTeam?.();
      return;
    }

    if (!userId) return;
    await foldersHook.createFolder({
      name: 'New Folder',
      icon: '📁',
      color: '#3B82F6',
      parent_id: null,
      owner_id: userId,
      team_id: null,
      position: 0,
    });
  }, [type, onAddTeam, userId, foldersHook]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    if (type === 'tasks') openContextMenu(e, { type: 'root' });
  }, [openContextMenu, type]);

  const handleTeamClick = useCallback((teamId: string) => {
    onTeamClick?.(teamId);
  }, [onTeamClick]);

  return (
    <div className="py-1">
      <div
        className="flex items-center justify-between px-1 group"
        onContextMenu={handleHeaderContextMenu}
      >
        <button
          onClick={handleToggleExpanded}
          className="flex items-center gap-2 flex-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md transition-colors text-left"
        >
          <ChevronRight
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          <span className="text-[11px] font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
            {title}
          </span>
        </button>

        <button
          onClick={handleAddNew}
          className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded opacity-0 group-hover:opacity-100 transition-opacity"
          title={`Add ${type === 'teams' ? 'team' : 'folder'}`}
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {isExpanded && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className="pl-2 mt-1 space-y-0.5"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 400px' }}
          >
            {type === 'tasks' ? (
              <>
                <div
                  ref={setRootDropRef}
                  className={`rounded-md transition-colors ${isRootOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700' : ''}`}
                >
                  {rootFolders.map((folder: FolderDTO) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      level={0}
                      getSubfolders={foldersHook.getSubfolders}
                      getFolderTasks={tasksHook.getFolderTasks}
                      onUpdateFolder={foldersHook.updateFolder}
                      onDeleteFolder={foldersHook.deleteFolder}
                      onUpdateTask={tasksHook.updateTask}
                      removingFolderIds={removingFolderIds}
                      removingTaskIds={removingTaskIds}
                    />
                  ))}

                  {orphanTasks.length > 0 && (
                    <div className="mt-1">
                      {orphanTasks.map((task: TaskDTO) => (
                        <TaskItem key={task.id} task={task} level={0} onUpdateTask={tasksHook.updateTask} isRemoving={!!removingTaskIds[task.id]} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {loadingTeams && (
                  <div className="pl-4 py-1.5 text-xs text-gray-500 dark:text-dark-text-muted text-left">Loading...</div>
                )}
                {!loadingTeams && teams.length === 0 && (
                  <div className="pl-4 py-1.5 text-xs text-gray-500 dark:text-dark-text-muted text-left">No teams yet</div>
                )}
                {teams.map((team) => (
                  <TeamItem
                    key={team.id}
                    id={team.id}
                    name={team.name}
                    isActive={activeTeamId === team.id}
                    onClick={handleTeamClick}
                  />
                ))}
              </>
            )}
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default SidebarSection;

const TeamItem: React.FC<{ id: string; name: string; isActive: boolean; onClick: (id: string) => void }> = React.memo(
  ({ id, name, isActive, onClick }) => {
    const handleClick = useCallback(() => onClick(id), [id, onClick]);
    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 pl-4 pr-2 py-1.5 rounded text-sm transition-colors text-left ${
          isActive
            ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text'
            : 'text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border'
        }`}
      >
        <span className="truncate flex-1">{name}</span>
      </button>
    );
  },
  (prev, next) => prev.id === next.id && prev.name === next.name && prev.isActive === next.isActive,
);
