import type { UserDTO } from '@/types/dto.js';

export const PROJECT_LIST_ICON_STROKE = 1.55;

export function formatProjectTargetDate(value: string | null): string {
  if (!value) return 'No target';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No target';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function toProjectTargetInputDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function getProjectMemberName(member?: UserDTO): string {
  if (!member) return 'No lead';
  return `${member.firstName || ''}${member.lastName ? ` ${member.lastName}` : ''}`.trim() || member.email;
}
