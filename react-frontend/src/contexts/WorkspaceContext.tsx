import React, {
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { WorkspaceDTO } from '@/types/dto.js';
import { useTheme } from '@/shared/contexts/useTheme.js';
import { realtimeClient } from '@/shared/lib/realtime.js';
import { userService } from '@/services/api/index.js';
import { useAuth } from './useAuth.js';
import { WorkspaceContext } from './workspaceContext.js';
import { clearLastWorkspaceId, getInitialWorkspace, setLastWorkspaceId } from './workspaceStorage.js';
import { isRetryableRequestError, loadWithRetry } from '@/shared/lib/loadWithRetry.js';

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setAccent, clearAccent } = useTheme();
  const { isAuthenticated, isInitialized } = useAuth();

  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceDTO | null>(getInitialWorkspace);

  useEffect(() => {
    if (activeWorkspace?.color) {
      setAccent(activeWorkspace.color);
    } else {
      clearAccent();
    }
  }, [activeWorkspace?.color, setAccent, clearAccent]);

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      const id = window.setTimeout(() => {
        setActiveWorkspaceState(null);
        clearAccent();
      }, 0);
      return () => window.clearTimeout(id);
    }

    if (!activeWorkspace?.id) return;

    let ignore = false;
    const workspaceId = activeWorkspace.id;

    loadWithRetry(
      () => userService.getWorkspaces(),
      { shouldRetry: isRetryableRequestError },
    )
      .then((workspaces) => {
        if (ignore) return;
        const next = workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
        if (next) {
          setActiveWorkspaceState(next);
        } else {
          setActiveWorkspaceState(null);
          clearLastWorkspaceId();
          clearAccent();
        }
      })
      .catch(() => {
        // Keep the saved workspace id; route-level loaders surface request errors.
      });

    return () => { ignore = true; };
  }, [activeWorkspace?.id, clearAccent, isAuthenticated, isInitialized]);

  // Live sync: when the active workspace's identity changes (icon/colour/name),
  // patch it here so the accent + every context consumer updates instantly.
  useEffect(() => {
    return realtimeClient.on<Partial<WorkspaceDTO> & { id: string }>(
      'workspace.updated',
      (env) => {
        const patch = env.payload;
        if (!patch?.id) return;
        setActiveWorkspaceState((prev) => (prev && prev.id === patch.id ? { ...prev, ...patch } : prev));
      },
    );
  }, []);

  const setActiveWorkspace = useCallback(
    (ws: WorkspaceDTO) => {
      setActiveWorkspaceState(ws);
      setLastWorkspaceId(ws.id);
    },
    [],
  );

  const clearActiveWorkspace = useCallback(() => {
    setActiveWorkspaceState(null);
    clearLastWorkspaceId();
    clearAccent();
  }, [clearAccent]);

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        activeWorkspaceId: activeWorkspace?.id ?? null,
        setActiveWorkspace,
        clearActiveWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
