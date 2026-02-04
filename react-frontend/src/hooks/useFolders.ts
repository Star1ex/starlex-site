import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { folderService } from '@/services/api/index.js';
import type { CreateFolderRequest, FolderDTO } from '@/types/dto.js';

const REMOVE_ANIMATION_MS = 220;

export const useFolders = () => {
  const [foldersById, setFoldersById] = useState<Record<string, FolderDTO>>({});
  const [folderIds, setFolderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingFolderIds, setRemovingFolderIds] = useState<Record<string, boolean>>({});
  const refreshControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const foldersByIdRef = useRef(foldersById);
  const folderIdsRef = useRef(folderIds);

  useEffect(() => {
    foldersByIdRef.current = foldersById;
  }, [foldersById]);

  useEffect(() => {
    folderIdsRef.current = folderIds;
  }, [folderIds]);

  const refreshFolders = useCallback(async () => {
    setLoading(true);
    try {
      if (refreshControllerRef.current) {
        refreshControllerRef.current.abort();
      }
      const controller = new AbortController();
      refreshControllerRef.current = controller;
      const data = await folderService.getUserFolders({ signal: controller.signal });
      const personal = (data || []).filter((f) => f.team_id == null || f.team_id === '');
      const nextById: Record<string, FolderDTO> = {};
      const nextIds: string[] = [];
      for (const folder of personal) {
        nextById[folder.id] = folder;
        nextIds.push(folder.id);
      }
      setFoldersById(nextById);
      setFolderIds(nextIds);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshFolders();
    }, 150);
  }, [refreshFolders]);

  useEffect(() => {
    refreshFolders();
    const onCreated = () => debouncedRefresh();
    window.addEventListener('personalFolderCreated', onCreated);
    const onNameChange = (event: Event) => {
      const ev = event as CustomEvent;
      const { id, name } = ev.detail || {};
      if (!id || typeof name !== 'string') return;
      setFoldersById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], name } as FolderDTO } : prev));
    };
    window.addEventListener('personalFolderNameChange', onNameChange as EventListener);
    return () => {
      window.removeEventListener('personalFolderCreated', onCreated);
      window.removeEventListener('personalFolderNameChange', onNameChange as EventListener);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      if (refreshControllerRef.current) {
        refreshControllerRef.current.abort();
      }
    };
  }, [refreshFolders, debouncedRefresh]);

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

    setFoldersById((prev) => ({ ...prev, [tempId]: optimisticFolder }));
    setFolderIds((prev) => [...prev, tempId]);

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
        const real = created as FolderDTO;
        setFoldersById((prev) => {
          const next = { ...prev };
          delete next[tempId];
          next[real.id] = real;
          return next;
        });
        setFolderIds((prev) => prev.map((id) => (id === tempId ? real.id : id)));
      }
      return created;
    } catch (err) {
      setFoldersById((prev) => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      setFolderIds((prev) => prev.filter((id) => id !== tempId));
      throw err;
    }
  }, [refreshFolders]);

  const updateFolder = useCallback(async (id: string, data: Partial<CreateFolderRequest>) => {
    setFoldersById((prev) => ({ ...prev, [id]: { ...prev[id], ...data } as FolderDTO }));
    try {
      const updated = await folderService.updateFolder(id, data as any);
      if (typeof updated !== 'string') {
        setFoldersById((prev) => ({ ...prev, [id]: updated as FolderDTO }));
      }
      return updated;
    } catch (err) {
      await refreshFolders();
      throw err;
    }
  }, [refreshFolders]);

  const moveFolder = useCallback(async (id: string, parentId: string | null) => {
    const snapshotById = foldersByIdRef.current;
    const snapshotIds = folderIdsRef.current;
    setFoldersById((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], parent_id: parentId } as FolderDTO } : prev));
    try {
      await folderService.moveFolder(id, parentId);
    } catch (err) {
      setFoldersById(snapshotById);
      setFolderIds(snapshotIds);
      throw err;
    }
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    const snapshotById = foldersByIdRef.current;
    const snapshotIds = folderIdsRef.current;
    setRemovingFolderIds((prev) => ({ ...prev, [id]: true }));
    await new Promise((resolve) => window.setTimeout(resolve, REMOVE_ANIMATION_MS));
    setFoldersById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setFolderIds((prev) => prev.filter((folderId) => folderId !== id));
    try {
      await folderService.deleteFolder(id);
    } catch (err) {
      setFoldersById(snapshotById);
      setFolderIds(snapshotIds);
      setRemovingFolderIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      throw err;
    } finally {
      setRemovingFolderIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }, []);

  const getSubfolders = useCallback((parentId: string) => {
    return folderIds.map((id) => foldersById[id]).filter((f) => f?.parent_id === parentId);
  }, [folderIds, foldersById]);

  const folders = useMemo(() => folderIds.map((id) => foldersById[id]).filter(Boolean), [folderIds, foldersById]);
  const rootFolders = useMemo(() => folders.filter((f) => f.parent_id == null), [folders]);

  return {
    folders,
    rootFolders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    removingFolderIds,
    getSubfolders,
    refreshFolders,
  } as const;
};
