import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import FolderItem from './FolderItem.js';
import TaskItem from './TaskItem.js';
import { useFolders } from '@/hooks/useFolders.js';
import { useTasks } from '@/hooks/useTasks.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { getAuthUser } from '@/shared/lib/authManager.js';
import type { FolderDTO, TaskDTO } from '@/types/dto.js';
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import InlineEdit from '@/components/shared/InlineEdit.js';

interface SidebarSectionProps {
  title: string;
  type: 'teams' | 'tasks';
  defaultExpanded?: boolean;
  teams?: Array<{ id: string; name: string; icon?: string }>;
  loadingTeams?: boolean;
  onTeamClick?: (teamId: string) => void;
  onAddTeam?: () => void;
  activeTeamId?: string | null;
  onRenameTeam?: (id: string, name: string) => Promise<void> | void;
  onDeleteTeam?: (id: string) => Promise<void> | void;
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
  onRenameTeam,
  onDeleteTeam,
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
  const recentTaskIds = tasksHook.recentTaskIds || {};
  const savingFolderIds = foldersHook.savingFolderIds || {};
  const recentFolderIds = foldersHook.recentFolderIds || {};
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
        if (over.type === 'folder') await tasksHook.moveTaskToFolder(active.id, over.id);
        if (over.type === 'root') await tasksHook.moveTaskToFolder(active.id, null);
        return;
      }

      if (active.type === 'folder') {
        if (over.type === 'folder') {
          if (active.id === over.id) return;
          if (isDescendant(over.id, active.id)) return;
          await foldersHook.moveFolder(active.id, over.id);
        }
        if (over.type === 'root') await foldersHook.moveFolder(active.id, null);
      }
    },
    [foldersHook, tasksHook, isDescendant]
  );

  const handleAddNew = useCallback(async () => {
    if (type === 'teams') {
      onAddTeam?.();
      return;
    }
    const storedUser = getAuthUser();
    const resolvedOwnerId = userId ?? storedUser?.id ?? '';
    await foldersHook.createFolder({
      name: 'New Folder',
      icon: '📁',
      color: '#3B82F6',
      parent_id: null,
      owner_id: resolvedOwnerId,
      position: 0,
    });
  }, [type, onAddTeam, userId, foldersHook]);

  const handleHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    if (type === 'tasks') openContextMenu(e, { type: 'root' });
  }, [openContextMenu, type]);

  const [teamMenu, setTeamMenu] = useState<{ show: boolean; x: number; y: number; teamId: string | null }>({
    show: false, x: 0, y: 0, teamId: null,
  });
  const [renamingTeamId, setRenamingTeamId] = useState<string | null>(null);

  const closeTeamMenu = useCallback(() => {
    setTeamMenu({ show: false, x: 0, y: 0, teamId: null });
  }, []);

  useEffect(() => {
    if (!teamMenu.show) return;
    const onClick = () => closeTeamMenu();
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [teamMenu.show, closeTeamMenu]);

  return (
    <div>
      {/* Section header */}
      <div
        className="flex items-center justify-between px-2 group mb-0.5"
        onContextMenu={handleHeaderContextMenu}
      >
        <button
          onClick={() => setIsExpanded((p) => !p)}
          className="flex items-center gap-1.5 flex-1 py-1.5 rounded transition-colors text-left"
        >
          <ChevronRight
            size={14}
            className={`text-gray-400 dark:text-dark-text-muted transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
          />
          <span className="text-xs font-semibold text-gray-400 dark:text-dark-text-muted tracking-wide">
            {title}
          </span>
        </button>

        <button
          onClick={handleAddNew}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-border opacity-0 group-hover:opacity-100 transition-opacity"
          title={`Add ${type === 'teams' ? 'team' : 'folder'}`}
        >
          <Plus size={14} className="text-gray-400 dark:text-dark-text-muted" />
        </button>
      </div>

      {isExpanded && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            className="space-y-0"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 400px' }}
          >
            {type === 'tasks' ? (
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
                    savingFolderIds={savingFolderIds}
                    recentFolderIds={recentFolderIds}
                    recentTaskIds={recentTaskIds}
                    removingFolderIds={removingFolderIds}
                    removingTaskIds={removingTaskIds}
                  />
                ))}
                {foldersHook.createError && (
                  <div className="px-4 py-1 text-xs text-red-500">{foldersHook.createError}</div>
                )}
                {orphanTasks.length > 0 && (
                  <div className="mt-0.5">
                    {orphanTasks.map((task: TaskDTO) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        level={0}
                        onUpdateTask={tasksHook.updateTask}
                        isRemoving={!!removingTaskIds[task.id]}
                        recentTaskIds={recentTaskIds}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {loadingTeams && (
                  <div className="pl-4 py-1 text-xs text-gray-400 dark:text-dark-text-muted">Loading…</div>
                )}
                {!loadingTeams && teams.length === 0 && (
                  <div className="pl-4 py-1 text-xs text-gray-400 dark:text-dark-text-muted">No workspaces yet</div>
                )}
                {teams.map((team) => (
                  <TeamItem
                    key={team.id}
                    id={team.id}
                    name={team.name}
                    icon={team.icon}
                    isActive={activeTeamId === team.id}
                    onClick={onTeamClick ?? (() => {})}
                    onOpenMenu={(e, teamId) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTeamMenu({ show: true, x: e.clientX, y: e.clientY, teamId });
                    }}
                    isRenaming={renamingTeamId === team.id}
                    onRename={async (newName) => {
                      if (!newName.trim()) { setRenamingTeamId(null); return; }
                      await onRenameTeam?.(team.id, newName.trim());
                      setRenamingTeamId(null);
                    }}
                    onCancelRename={() => setRenamingTeamId(null)}
                  />
                ))}
              </>
            )}
          </div>
        </DndContext>
      )}

      {teamMenu.show && teamMenu.teamId && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeTeamMenu} />
          <div
            className="fixed z-50 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: teamMenu.x, top: teamMenu.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setRenamingTeamId(teamMenu.teamId); closeTeamMenu(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border text-gray-700 dark:text-dark-text"
            >
              Rename
            </button>
            <button
              onClick={async () => { await onDeleteTeam?.(teamMenu.teamId as string); closeTeamMenu(); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border text-red-600"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SidebarSection;

const TeamItem: React.FC<{
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  onClick: (id: string) => void;
  onOpenMenu: (e: React.MouseEvent, id: string) => void;
  isRenaming: boolean;
  onRename: (name: string) => void;
  onCancelRename: () => void;
}> = React.memo(
  ({ id, name, icon, isActive, onClick, onOpenMenu, isRenaming, onRename, onCancelRename }) => {
    const handleClick = useCallback(() => onClick(id), [id, onClick]);
    return (
      <div
        onClick={handleClick}
        onContextMenu={(e) => onOpenMenu(e, id)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors cursor-pointer mx-0 ${
          isActive
            ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text font-medium'
            : 'text-gray-600 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border hover:text-gray-900 dark:hover:text-dark-text'
        }`}
      >
        {icon ? (
          <span className="flex-shrink-0 text-base leading-none" style={{ width: 16, textAlign: 'center' }}>{icon}</span>
        ) : (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isActive ? 'bg-gray-900 dark:bg-dark-text' : 'bg-gray-300 dark:bg-dark-text-muted'
            }`}
          />
        )}
        {isRenaming ? (
          <InlineEdit
            value={name}
            onSave={onRename}
            onCancel={onCancelRename}
            className="w-full text-sm bg-transparent border-0 outline-none p-0 focus:outline-none"
          />
        ) : (
          <span className="truncate flex-1">{name}</span>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.id === next.id &&
    prev.name === next.name &&
    prev.icon === next.icon &&
    prev.isActive === next.isActive &&
    prev.isRenaming === next.isRenaming,
);
