import React, { createContext, useContext, useEffect, useState } from 'react';
import { folderService, taskService } from '@/services/api/index.js';
import type { FolderDTO, TaskDTO, CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { Modal } from '@/shared/ui/Modal.js';
import FolderCreateModal from '@/components/PersonalTasks/FolderCreateModal.js';
import TaskCreateView from '@/components/PersonalTasks/TaskCreateView.js';

type PersonalTasksState = {
  folders: FolderDTO[];
  tasks: TaskDTO[];
  isLoading: boolean;
  refreshFolders: () => Promise<void>;
  refreshTasks: () => Promise<void>;
};

type PersonalTasksActions = {
  createTask: (data: Partial<CreateTaskRequest>) => Promise<void>;
  createFolder: (data: Partial<CreateFolderRequest>) => Promise<void>;
  openCreateTask: (folderId?: string | null) => void;
  openCreateFolder: (parentId?: string | null) => void;
  closeCreateFolder: () => void;
};

const PersonalTasksStateContext = createContext<PersonalTasksState | undefined>(undefined);
const PersonalTasksActionsContext = createContext<PersonalTasksActions | undefined>(undefined);

export const PersonalTasksProvider = ({ children }: { children: React.ReactNode }) => {
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskDefaults, setCreateTaskDefaults] = useState<Partial<CreateTaskRequest> | null>(null);
  const [createFolderDefaults, setCreateFolderDefaults] = useState<Partial<CreateFolderRequest> | null>(null);
  const { userId } = useAuth();

  const refreshFolders = React.useCallback(async () => {
    try {
      const data = await folderService.getUserFolders();
      setFolders(data);
    } catch (err) {
      console.error('Failed to refresh folders', err);
    }
  }, []);

  const refreshTasks = React.useCallback(async () => {
    try {
      const data = await taskService.getPersonalTasks();
      // Ensure only personal tasks (team_id == null OR empty string)
      const personal = (data || []).filter((t) => t.team_id == null || t.team_id === '');
      setTasks(personal);
    } catch (err) {
      console.error('Failed to refresh tasks', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([refreshFolders(), refreshTasks()]);
      setIsLoading(false);
    };
    load();

    const onCreateFolder = (e: Event) => {
      const ev = e as CustomEvent;
      const { parent_id } = ev.detail || {};
      setCreateFolderDefaults(parent_id ? { parent_id } : null);
      setShowCreateFolder(true);
    };

    const onCreateTask = (e: Event) => {
      const ev = e as CustomEvent;
      const { folder_id } = ev.detail || {};
      setCreateTaskDefaults(folder_id ? { folder_id } : null);
      setShowCreateTask(true);
    };

    window.addEventListener('openPersonalFolderCreate', onCreateFolder as EventListener);
    window.addEventListener('openPersonalTaskCreate', onCreateTask as EventListener);

    return () => {
      window.removeEventListener('openPersonalFolderCreate', onCreateFolder as EventListener);
      window.removeEventListener('openPersonalTaskCreate', onCreateTask as EventListener);
    };
  }, []);

  const createTask = React.useCallback(async (data: Partial<CreateTaskRequest>) => {
    try {
      const payload = {
        task: data.task || 'New Task',
        description: data.description || '',
        priority: data.priority || 'medium',
        progress: data.progress || 'not_started',
        folder_id: data.folder_id ?? null,
        owner_id: userId || '',
        team_id: null,
        user_ids: data.user_ids ?? [],
      };
      await taskService.createPersonalTask(payload as CreateTaskRequest);
      await refreshTasks();
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
    } catch (err) {
      console.error('Failed to create task', err);
      throw err;
    }
  }, [refreshTasks]);

  const createFolder = React.useCallback(async (data: Partial<CreateFolderRequest>) => {
    try {
      const payload = {
        name: data.name || 'New Folder',
        color: data.color || '#3B82F6',
        icon: data.icon || '📁',
        parent_id: data.parent_id ?? null,
        team_id: null,
        owner_id: userId || '',
        position: data.position ?? 0,
      };
      await folderService.createFolder(payload as CreateFolderRequest);
      await refreshFolders();
      window.dispatchEvent(new CustomEvent('personalFolderCreated'));
    } catch (err) {
      console.error('Failed to create folder', err);
      throw err;
    }
  }, [refreshFolders]);

  const actionsValue = React.useMemo(() => ({
    createTask,
    createFolder,
    openCreateTask: (folderId?: string | null) => {
      setCreateTaskDefaults(folderId ? { folder_id: folderId } : null);
      setShowCreateTask(true);
    },
    openCreateFolder: (parentId?: string | null) => {
      setCreateFolderDefaults(parentId ? { parent_id: parentId } : null);
      setShowCreateFolder(true);
    },
    closeCreateFolder: () => setShowCreateFolder(false),
  }), [createTask, createFolder]);

  const stateValue = React.useMemo(() => ({
    folders,
    tasks,
    isLoading,
    refreshFolders,
    refreshTasks,
  }), [folders, tasks, isLoading, refreshFolders, refreshTasks]);

  return (
    <PersonalTasksStateContext.Provider value={stateValue}>
      <PersonalTasksActionsContext.Provider value={actionsValue}>
        {children}

        {/* Folder create modal (shared) */}
        <Modal open={showCreateFolder} onClose={() => setShowCreateFolder(false)}>
          <FolderCreateModal onClose={() => setShowCreateFolder(false)} parentId={createFolderDefaults?.parent_id} />
        </Modal>

        {/* Task create modal (shared) */}
        <Modal open={showCreateTask} onClose={() => setShowCreateTask(false)}>
          <TaskCreateView onClose={() => setShowCreateTask(false)} initialFolderId={createTaskDefaults?.folder_id} />
        </Modal>
      </PersonalTasksActionsContext.Provider>
    </PersonalTasksStateContext.Provider>
  );
};

export const usePersonalTasksState = () => {
  const ctx = useContext(PersonalTasksStateContext);
  if (!ctx) throw new Error('usePersonalTasksState must be used inside PersonalTasksProvider');
  return ctx;
};

export const usePersonalTasksActions = () => {
  const ctx = useContext(PersonalTasksActionsContext);
  if (!ctx) throw new Error('usePersonalTasksActions must be used inside PersonalTasksProvider');
  return ctx;
};

// Backwards-compatible combined hook
export const usePersonalTasks = () => {
  const state = usePersonalTasksState();
  const actions = usePersonalTasksActions();
  return { ...state, ...actions } as const;
};
