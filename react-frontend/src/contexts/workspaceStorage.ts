import type { WorkspaceDTO } from '@/types/dto.js';

const LAST_WS_KEY = 'starlex-last-workspace-id';

export function getLastWorkspaceId(): string | null {
  return localStorage.getItem(LAST_WS_KEY);
}

export function getInitialWorkspace(): WorkspaceDTO | null {
  const savedId = getLastWorkspaceId();
  return savedId ? { id: savedId, name: '', description: '' } : null;
}

export function setLastWorkspaceId(workspaceId: string): void {
  localStorage.setItem(LAST_WS_KEY, workspaceId);
}

export function clearLastWorkspaceId(): void {
  localStorage.removeItem(LAST_WS_KEY);
}
