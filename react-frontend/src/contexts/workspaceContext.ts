import { createContext } from 'react';
import type { WorkspaceDTO } from '@/types/dto.js';

export interface WorkspaceContextType {
  activeWorkspace: WorkspaceDTO | null;
  activeWorkspaceId: string | null;
  setActiveWorkspace: (ws: WorkspaceDTO) => void;
  clearActiveWorkspace: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);
