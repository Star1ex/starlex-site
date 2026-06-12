import type { WorkspaceRole } from '@/types/dto.js';
import { MEMBER_ROLE_META } from './memberRoleData.js';

export function MemberRoleBadge({ role }: { role: WorkspaceRole }) {
  if (role === 'owner') {
    return <span className="label-caps text-[color:var(--status-done-text)]">Owner</span>;
  }

  const meta = MEMBER_ROLE_META[role] ?? MEMBER_ROLE_META.member;
  return (
    <span className="sx-chip" style={{ color: meta.color }}>
      <span className="sx-dot" />
      <span>{meta.label}</span>
    </span>
  );
}
