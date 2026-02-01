import React, { createContext, useContext, useEffect, useState } from 'react';
import { folderService, taskService } from '@/services/api/index.js';
import type { FolderDTO, TaskDTO, CreateFolderRequest, CreateTaskRequest } from '@/types/dto.js';
import { useAuth } from '@/contexts/AuthContext.js';

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
      setTasks(data);
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

    const onCreateFolder = () => setShowCreateFolder(true);
    const onCreateTask = () => setShowCreateTask(true);
    window.addEventListener('openPersonalFolderCreate', onCreateFolder);
    window.addEventListener('openPersonalTaskCreate', onCreateTask);

    return () => {
      window.removeEventListener('openPersonalFolderCreate', onCreateFolder);
      window.removeEventListener('openPersonalTaskCreate', onCreateTask);
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
      {/* Modal placeholder */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="p-4 bg-white rounded shadow">
            {/* Simple inline folder modal to avoid new modal wiring complexity for now */}
            <div className="mb-2">Create a folder</div>
            <button onClick={() => createFolder({ name: 'New Folder from modal' })} className="px-3 py-1 bg-black text-white rounded">Create</button>
            <button onClick={() => setShowCreateFolder(false)} className="ml-2 px-3 py-1 border rounded">Cancel</button>
          </div>
        </div>
      )}

      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="p-4 bg-white rounded shadow max-w-2xl w-full">
            {/* Use TaskCreateView component */}
            <div className="mb-2 text-lg font-medium">Create Personal Task</div>
            <div className="grid grid-cols-1 gap-3">
              <input placeholder="Title" className="p-2 border rounded" />
              <textarea placeholder="Description (markdown)" className="p-2 border rounded h-48" />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCreateTask(false)} className="px-3 py-1 border rounded">Cancel</button>
                <button onClick={async () => { await createTask({ task: 'Untitled' }); setShowCreateTask(false); }} className="px-3 py-1 bg-black text-white rounded">Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PersonalTasksContext.Provider>
  );
};

export const usePersonalTasks = () => {
  const ctx = useContext(PersonalTasksContext);
  if (!ctx) throw new Error('usePersonalTasks must be used inside PersonalTasksProvider');
  return ctx;
};
