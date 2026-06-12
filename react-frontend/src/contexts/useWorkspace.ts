import { useContext } from 'react';
import { WorkspaceContext, type WorkspaceContextType } from './workspaceContext.js';
export { getLastWorkspaceId } from './workspaceStorage.js';

export const useWorkspace = (): WorkspaceContextType => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
};
