import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import FolderItem from './FolderItem.js';
import TaskItem from './TaskItem.js';
import { useFolders } from '@/hooks/useFolders.js';
import { useTasks } from '@/hooks/useTasks.js';
import { useContextMenu } from '@/hooks/useContextMenu.js';
import { useAuth } from '@/contexts/AuthContext.js';
import type { FolderDTO, TaskDTO } from '@/types/dto.js';

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

  const rootFolders = useMemo(() => foldersHook.rootFolders.sort((a, b) => (a.name || '').localeCompare(b.name || '')), [foldersHook.rootFolders]);
  const orphanTasks = useMemo(() => tasksHook.orphanTasks.sort((a, b) => (a.task || '').localeCompare(b.task || '')), [tasksHook.orphanTasks]);

  const handleAddNew = async () => {
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
  };

  return (
    <div className="py-1">
      <div
        className="flex items-center justify-between px-1 group"
        onContextMenu={(e) => {
          if (type === 'tasks') openContextMenu(e, { type: 'root' });
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
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
        <div className="pl-2 mt-1 space-y-0.5">
          {type === 'tasks' ? (
            <>
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
                />
              ))}

              {orphanTasks.length > 0 && (
                <div className="mt-1">
                  {orphanTasks.map((task: TaskDTO) => (
                    <TaskItem key={task.id} task={task} level={0} onUpdateTask={tasksHook.updateTask} />
                  ))}
                </div>
              )}
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
                <button
                  key={team.id}
                  onClick={() => onTeamClick?.(team.id)}
                  className={`w-full flex items-center gap-2 pl-4 pr-2 py-1.5 rounded text-sm transition-colors text-left ${
                    activeTeamId === team.id
                      ? 'bg-gray-100 dark:bg-dark-border text-gray-900 dark:text-dark-text'
                      : 'text-gray-700 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-border'
                  }`}
                >
                  <span className="truncate flex-1">{team.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;
