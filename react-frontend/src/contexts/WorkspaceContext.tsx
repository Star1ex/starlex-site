import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { WorkspaceDTO } from '@/types/dto.js';
import { useTheme } from '@/shared/contexts/ThemeContext.js';

const LAST_WS_KEY = 'starlex-last-workspace-id';

interface WorkspaceContextType {
  activeWorkspace: WorkspaceDTO | null;
  activeWorkspaceId: string | null;
  setActiveWorkspace: (ws: WorkspaceDTO) => void;
  clearActiveWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { setAccent, clearAccent } = useTheme();

  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceDTO | null>(null);

  const setActiveWorkspace = useCallback(
    (ws: WorkspaceDTO) => {
      setActiveWorkspaceState(ws);
      localStorage.setItem(LAST_WS_KEY, ws.id);
      if (ws.color) {
        setAccent(ws.color);
      } else {
        clearAccent();
      }
    },
    [setAccent, clearAccent],
  );

  const clearActiveWorkspace = useCallback(() => {
    setActiveWorkspaceState(null);
    localStorage.removeItem(LAST_WS_KEY);
    clearAccent();
  }, [clearAccent]);

  // Restore last-visited workspace id (the full object will be hydrated by the
  // WorkspacePage / GlobalSidebar once it fetches workspace data).
  useEffect(() => {
    const savedId = localStorage.getItem(LAST_WS_KEY);
    if (savedId && !activeWorkspace) {
      setActiveWorkspaceState({ id: savedId, name: '', description: '' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

export const useWorkspace = (): WorkspaceContextType => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
};

export function getLastWorkspaceId(): string | null {
  return localStorage.getItem(LAST_WS_KEY);
}
