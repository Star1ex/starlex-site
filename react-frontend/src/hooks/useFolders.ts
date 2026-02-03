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
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticFolder: FolderDTO = {
      id: tempId,
      name: data.name || 'New Folder',
      color: data.color || '#3B82F6',
      icon: data.icon || '📁',
      parent_id: data.parent_id ?? null,
      team_id: data.team_id ?? null,
      owner_id: data.owner_id,
      position: data.position ?? 0,
      created_at: now,
      updated_at: now,
    };

    setFolders((prev) => [...prev, optimisticFolder]);

    const payload: CreateFolderRequest = {
      name: data.name || 'New Folder',
      color: data.color || '#3B82F6',
      icon: data.icon || '📁',
      parent_id: data.parent_id ?? null,
      owner_id: data.owner_id,
      team_id: data.team_id ?? null,
      position: data.position ?? 0,
    };

    try {
      const created = await folderService.createFolder(payload);
      // If API returns a string, refresh to reconcile. Otherwise replace temp.
      if (typeof created === 'string') {
        await refreshFolders();
      } else {
        setFolders((prev) => prev.map((f) => (f.id === tempId ? (created as any) : f)));
      }
      window.dispatchEvent(new CustomEvent('personalFolderCreated'));
      return created;
    } catch (err) {
      setFolders((prev) => prev.filter((f) => f.id !== tempId));
      throw err;
    }
  }, [refreshFolders]);

  const updateFolder = useCallback(async (id: string, data: Partial<CreateFolderRequest>) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } as FolderDTO : f)));
    try {
      const updated = await folderService.updateFolder(id, data as any);
      if (typeof updated !== 'string') {
        setFolders((prev) => prev.map((f) => (f.id === id ? (updated as any) : f)));
      }
      return updated;
    } catch (err) {
      await refreshFolders();
      throw err;
    }
  }, [refreshFolders]);

  const deleteFolder = useCallback(async (id: string) => {
    const snapshot = folders;
    setFolders((prev) => prev.filter((f) => f.id !== id));
    try {
      await folderService.deleteFolder(id);
      window.dispatchEvent(new CustomEvent('personalFolderCreated'));
    } catch (err) {
      setFolders(snapshot);
      throw err;
    }
  }, [folders]);

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
