import { useCallback, useEffect, useMemo, useState } from 'react';
import { folderService } from '@/services/api/index.js';
import type { CreateFolderRequest, FolderDTO } from '@/types/dto.js';

export const useFolders = () => {
  const [folders, setFolders] = useState<FolderDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFolders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await folderService.getUserFolders();
      const personal = (data || []).filter((f) => f.team_id == null || f.team_id === '');
      setFolders(personal);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFolders();
    const onCreated = () => refreshFolders();
    window.addEventListener('personalFolderCreated', onCreated);
    return () => window.removeEventListener('personalFolderCreated', onCreated);
  }, [refreshFolders]);

  const createFolder = useCallback(async (data: CreateFolderRequest) => {
    const payload: CreateFolderRequest = {
      name: data.name || 'New Folder',
      color: data.color || '#3B82F6',
      icon: data.icon || '📁',
      parent_id: data.parent_id ?? null,
      owner_id: data.owner_id,
      team_id: data.team_id ?? null,
      position: data.position ?? 0,
    };

    const created = await folderService.createFolder(payload);
    await refreshFolders();
    window.dispatchEvent(new CustomEvent('personalFolderCreated'));
    return created;
  }, [refreshFolders]);

  const updateFolder = useCallback(async (id: string, data: Partial<CreateFolderRequest>) => {
    const updated = await folderService.updateFolder(id, data as any);
    await refreshFolders();
    return updated;
  }, [refreshFolders]);

  const deleteFolder = useCallback(async (id: string) => {
    await folderService.deleteFolder(id);
    await refreshFolders();
    window.dispatchEvent(new CustomEvent('personalFolderCreated'));
  }, [refreshFolders]);

  const getSubfolders = useCallback((parentId: string) => {
    return folders.filter((f) => f.parent_id === parentId);
  }, [folders]);

  const rootFolders = useMemo(() => folders.filter((f) => f.parent_id == null), [folders]);

  return {
    folders,
    rootFolders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    getSubfolders,
    refreshFolders,
  } as const;
};
