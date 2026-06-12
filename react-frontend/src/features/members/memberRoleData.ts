import type { UserDTO, WorkspaceRole } from '@/types/dto.js';

export const MEMBER_ROLE_META: Record<WorkspaceRole, { label: string; color: string }> = {
  owner:  { label: 'Owner', color: 'var(--status-done-text)' },
  admin:  { label: 'Admin', color: 'var(--priority-medium-text)' },
  member: { label: 'Member', color: 'var(--priority-low-text)' },
  guest:  { label: 'Guest', color: 'var(--sx-text-subtle)' },
};

export const EDITABLE_MEMBER_ROLES: WorkspaceRole[] = ['admin', 'member', 'guest'];

export function getMemberAvatarSrc(user: UserDTO): string | undefined {
  return user.photo_url ?? user.avatar_url ?? undefined;
}

export function getMemberInitials(user: UserDTO): string {
  return [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';
}

export function formatMemberJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
    ?? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? fallback;
}
