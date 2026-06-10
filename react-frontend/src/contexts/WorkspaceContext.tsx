import React, {
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { WorkspaceDTO } from '@/types/dto.js';
import { useTheme } from '@/shared/contexts/useTheme.js';
import { WorkspaceContext } from './workspaceContext.js';
import { clearLastWorkspaceId, getInitialWorkspace, setLastWorkspaceId } from './workspaceStorage.js';

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setAccent, clearAccent } = useTheme();

  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceDTO | null>(getInitialWorkspace);

  useEffect(() => {
    if (activeWorkspace?.color) {
      setAccent(activeWorkspace.color);
    } else {
      clearAccent();
    }
  }, [activeWorkspace?.color, setAccent, clearAccent]);

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
