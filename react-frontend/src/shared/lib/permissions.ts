import type { WorkspaceRole } from '@/types/dto.js';

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 4, admin: 3, member: 2, guest: 1,
};

function atLeast(role: WorkspaceRole | undefined, min: WorkspaceRole): boolean {
  return (ROLE_RANK[role ?? 'guest'] ?? 0) >= ROLE_RANK[min];
}

export const can = {
  createTask:       (role?: WorkspaceRole) => atLeast(role, 'member'),
  editTask:         (role?: WorkspaceRole) => atLeast(role, 'member'),
  deleteTask:       (role?: WorkspaceRole, isOwner?: boolean) => isOwner === true || atLeast(role, 'admin'),
  assignTask:       (role?: WorkspaceRole) => atLeast(role, 'member'),
  manageSprint:     (role?: WorkspaceRole) => atLeast(role, 'admin'),
  manageProject:    (role?: WorkspaceRole, isLeader?: boolean) => isLeader === true || atLeast(role, 'admin'),
  manageWorkspace:  (role?: WorkspaceRole) => atLeast(role, 'admin'),
  manageMembers:    (role?: WorkspaceRole) => atLeast(role, 'admin'),
  changeRole:       (role?: WorkspaceRole) => atLeast(role, 'admin'),
  inviteMembers:    (role?: WorkspaceRole) => atLeast(role, 'admin'),
  dangerZone:       (role?: WorkspaceRole) => atLeast(role, 'owner'),
} as const;
