import React, { createContext, useContext, useEffect, useState } from 'react';
import { folderService, taskService } from '@/services/api/index.js';
import type { FolderDTO, TaskDTO, CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';
import { useAuth } from '@/contexts/AuthContext.js';
import { Modal } from '@/shared/ui/Modal.js';
import FolderCreateModal from '@/components/PersonalTasks/FolderCreateModal.js';
import TaskCreateView from '@/components/PersonalTasks/TaskCreateView.js';

type PersonalTasksContextType = {
  folders: FolderDTO[];
  tasks: TaskDTO[];
  isLoading: boolean;
  refreshFolders: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  createTask: (data: Partial<CreateTaskRequest>) => Promise<void>;
  createFolder: (data: Partial<CreateFolderRequest>) => Promise<void>;
  openCreateTask: () => void;
  openCreateFolder: () => void;
  closeCreateFolder: () => void;
};

const PersonalTasksContext = createContext<PersonalTasksContextType | undefined>(undefined);

export const PersonalTasksProvider = ({ children }: { children: React.ReactNode }) => {
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskDefaults, setCreateTaskDefaults] = useState<Partial<CreateTaskRequest> | null>(null);
  const [createFolderDefaults, setCreateFolderDefaults] = useState<Partial<CreateFolderRequest> | null>(null);
  const { userId } = useAuth();

  const refreshFolders = async () => {
    try {
      const data = await folderService.getUserFolders();
      setFolders(data);
    } catch (err) {
      console.error('Failed to refresh folders', err);
    }
  };

  const refreshTasks = async () => {
    try {
      const data = await taskService.getPersonalTasks();
      // Ensure only personal tasks (team_id === null)
      const personal = (data || []).filter((t) => t.team_id === null);
      setTasks(personal);
    } catch (err) {
      console.error('Failed to refresh tasks', err);
    }
  };

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

  const createTask = async (data: Partial<CreateTaskRequest>) => {
    try {
      const payload = {
        task: data.task || 'New Task',
        description: data.description || '',
        priority: data.priority || 'medium',
        progress: data.progress || 'not_started',
        folder_id: data.folder_id ?? null,
        owner_id: userId || '',
        team_id: null,
      };
      await taskService.createPersonalTask(payload as CreateTaskRequest);
      await refreshTasks();
      window.dispatchEvent(new CustomEvent('personalTaskCreated'));
    } catch (err) {
      console.error('Failed to create task', err);
      throw err;
    }
  };

  const createFolder = async (data: Partial<CreateFolderRequest>) => {
    try {
      const payload = {
        name: data.name || 'New Folder',
        color: data.color || '#3B82F6',
        icon: data.icon || 'code',
        parent_id: data.parent_id ?? null,
        team_id: null,
        owner_id: userId || '',
      };
      await folderService.createFolder(payload as CreateFolderRequest);
      await refreshFolders();
      window.dispatchEvent(new CustomEvent('personalFolderCreated'));
    } catch (err) {
      console.error('Failed to create folder', err);
      throw err;
    }
  };

  return (
    <PersonalTasksContext.Provider
      value={{
        folders,
        tasks,
        isLoading,
        refreshFolders,
        refreshTasks,
        createTask,
        createFolder,
        openCreateTask: () => window.dispatchEvent(new CustomEvent('openPersonalTaskCreate')),
        openCreateFolder: () => setShowCreateFolder(true),
        closeCreateFolder: () => setShowCreateFolder(false),
      }}
    >
      {children}

      {/* Folder create modal (shared) */}
      <Modal open={showCreateFolder} onClose={() => setShowCreateFolder(false)}>
        <FolderCreateModal onClose={() => setShowCreateFolder(false)} parentId={createFolderDefaults?.parent_id} />
      </Modal>

      {/* Task create modal (shared) */}
      <Modal open={showCreateTask} onClose={() => setShowCreateTask(false)}>
        <TaskCreateView onClose={() => setShowCreateTask(false)} initialFolderId={createTaskDefaults?.folder_id} />
      </Modal>
    </PersonalTasksContext.Provider>
  );
};

export const usePersonalTasks = () => {
  const ctx = useContext(PersonalTasksContext);
  if (!ctx) throw new Error('usePersonalTasks must be used inside PersonalTasksProvider');
  return ctx;
};
