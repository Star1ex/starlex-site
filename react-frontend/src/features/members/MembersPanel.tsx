import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Plus, Trash2, ChevronDown, Check, X, Shield, Crown, Eye, User } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import type { WorkspaceMemberDTO, WorkspaceRole } from '@/types/dto.js';
import { showToast } from '@/shared/lib/toast.js';
import { useAuth } from '@/contexts/useAuth.js';
import { Glass } from '@/shared/ui/glass/index.js';

const ROLE_META: Record<WorkspaceRole, { label: string; icon: React.ReactNode; cls: string }> = {
  owner:  { label: 'Owner',  icon: <Crown size={11} />,  cls: 'text-[color:var(--priority-high-text)] bg-[color:var(--priority-high-bg)]' },
  admin:  { label: 'Admin',  icon: <Shield size={11} />, cls: 'text-[color:var(--priority-medium-text)] bg-[color:var(--priority-medium-bg)]' },
  member: { label: 'Member', icon: <User size={11} />,   cls: 'text-[color:var(--priority-low-text)] bg-[color:var(--priority-low-bg)]' },
  guest:  { label: 'Guest',  icon: <Eye size={11} />,    cls: 'text-[color:var(--sx-text-subtle)] bg-[color:var(--sx-surface)]' },
};

const ROLE_ORDER: WorkspaceRole[] = ['owner', 'admin', 'member', 'guest'];

function canManage(currentRole: WorkspaceRole | undefined): boolean {
  return currentRole === 'owner' || currentRole === 'admin';
}

function RoleBadge({ role }: { role: WorkspaceRole }) {
  // Owner reads as a quiet label-caps mark in the done hue — no crown, no pill.
  if (role === 'owner') {
    return <span className="label-caps text-[color:var(--status-done-text)]">Owner</span>;
  }
  const m = ROLE_META[role] ?? ROLE_META.member;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium ${m.cls}`}>
      {m.icon}
      {m.label}
    </span>
  );
}

interface RolePickerProps {
  value: WorkspaceRole;
  onChange: (r: WorkspaceRole) => void;
  disabled?: boolean;
}

function RolePicker({ value, onChange, disabled }: RolePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(p => !p)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm text-[color:var(--sx-text-muted)] bg-[color:var(--sx-surface)] hover:bg-[color:var(--sx-surface-hover)] transition-colors disabled:opacity-40 disabled:cursor-default"
      >
        {ROLE_META[value]?.label ?? value}
        {!disabled && <ChevronDown size={11} className="text-[color:var(--sx-text-subtle)]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="dropdown-menu absolute right-0 top-9 z-20 min-w-[120px]"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.1 } }}
            exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.07 } }}
          >
            {ROLE_ORDER.filter(r => r !== 'owner').map(r => (
              <button
                key={r}
                onClick={() => { onChange(r); setOpen(false); }}
                className="dropdown-menu-item justify-between"
              >
                {ROLE_META[r].label}
                {r === value && <Check size={12} className="text-[color:var(--sx-accent)]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberRow({
  member,
  currentUserId,
  currentRole,
  onRoleChange,
  onRemove,
}: {
  member: WorkspaceMemberDTO;
  currentUserId: string | null;
  currentRole: WorkspaceRole | undefined;
  onRoleChange: (userId: string, role: WorkspaceRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const u = member.user;
  const isCurrentUser = u.id === currentUserId;
  const isOwner = member.role === 'owner';
  const canEdit = canManage(currentRole) && !isOwner;

  return (
    <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-[color:var(--sx-surface-hover)] transition-colors">
      {u.photo_url || u.avatar_url ? (
        <img src={(u.photo_url || u.avatar_url)!} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[color:var(--sx-surface-active)] flex items-center justify-center text-sm font-semibold text-[color:var(--sx-text-muted)] flex-shrink-0">
          {u.firstName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-body-md text-[color:var(--sx-text)] font-medium truncate">
          {u.firstName} {u.lastName}
          {isCurrentUser && <span className="text-[color:var(--sx-text-subtle)] font-normal ml-2">(you)</span>}
        </p>
        <p className="text-label-sm text-[color:var(--sx-text-subtle)] truncate">{u.email}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canEdit ? (
          <RolePicker value={member.role} onChange={r => onRoleChange(u.id, r)} />
        ) : (
          <RoleBadge role={member.role} />
        )}
        {canEdit && !isCurrentUser && (
          <button
            onClick={() => onRemove(u.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[color:var(--sx-text-disabled)] hover:text-[color:var(--sx-danger)] hover:bg-[color:color-mix(in_srgb,var(--sx-danger)_12%,transparent)] transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── invite link section ───────────────────────────────────────────────────────

function InviteSection({ workspaceId, canManageMembers }: { workspaceId: string; canManageMembers: boolean }) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setCreating(true);
    try {
      const { token } = await workspaceService.createInvite(workspaceId, 'member');
      const url = `${window.location.origin}/invite/${token}`;
      setInviteUrl(url);
    } catch {
      showToast('Failed to generate invite link');
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!canManageMembers) return null;

  return (
    <div className="rounded-xl p-4 space-y-3 bg-[color:var(--sx-canvas-elevated)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-md text-[color:var(--sx-text)] font-medium">Invite link</p>
          <p className="text-label-sm text-[color:var(--sx-text-subtle)]">Anyone with the link can join as a member</p>
        </div>
        {!inviteUrl && (
          <button onClick={generate} disabled={creating} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm disabled:opacity-40">
            <Link2 size={12} />
            {creating ? 'Generating…' : 'Generate'}
          </button>
        )}
      </div>
      {inviteUrl && (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-label-sm text-[color:var(--sx-text-muted)] bg-[color:var(--sx-surface)] rounded-lg px-3 py-2 truncate font-mono">
            {inviteUrl}
          </code>
          <button onClick={copy} className="liquid-button gap-1.5 !py-1.5 !px-3 !text-label-sm flex-shrink-0">
            {copied ? <Check size={12} className="text-[color:var(--status-done-text)]" /> : <Link2 size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={() => setInviteUrl(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-[color:var(--sx-text-disabled)] hover:text-[color:var(--sx-text-muted)] transition-colors">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── add member form ───────────────────────────────────────────────────────────

function AddMemberForm({ workspaceId, onAdded }: { workspaceId: string; onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      await workspaceService.addMember(workspaceId, trimmed, 'member');
      setEmail('');
      onAdded();
      showToast('Member invited');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setError(''); }}
        placeholder="name@company.com"
        disabled={loading}
        className="flex-1 glass-input !rounded-xl !py-2 !text-body-md disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="liquid-button gap-1.5 !bg-[color:var(--sx-accent)] !border-transparent !text-[color:var(--sx-accent-contrast)] disabled:opacity-40 flex-shrink-0"
      >
        <Plus size={14} />
        {loading ? 'Adding…' : 'Add'}
      </button>
      {error && <p className="text-label-sm text-[color:var(--sx-danger)] mt-1 absolute">{error}</p>}
    </form>
  );
}

// ─── main export ───────────────────────────────────────────────────────────────

interface MembersPanelProps {
  workspaceId: string;
  currentRole: WorkspaceRole | undefined;
}

export const MembersPanel: React.FC<MembersPanelProps> = ({ workspaceId, currentRole }) => {
  const { userId } = useAuth();
  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ms = await workspaceService.listMembers(workspaceId);
      setMembers(ms);
    } catch {
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = useCallback(async (userId: string, role: WorkspaceRole) => {
    const prev = members;
    setMembers(ms => ms.map(m => m.user.id === userId ? { ...m, role } : m));
    try {
      await workspaceService.updateMemberRole(workspaceId, userId, role);
    } catch {
      setMembers(prev);
      showToast('Failed to update role');
    }
  }, [members, workspaceId]);

  const handleRemove = useCallback(async (userId: string) => {
    if (!confirm('Remove this member from the workspace?')) return;
    const prev = members;
    setMembers(ms => ms.filter(m => m.user.id !== userId));
    try {
      await workspaceService.removeMember(workspaceId, userId);
      showToast('Member removed');
    } catch {
      setMembers(prev);
      showToast('Failed to remove member');
    }
  }, [members, workspaceId]);

  const isAdmin = canManage(currentRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-sm font-hanken font-semibold text-[color:var(--sx-text)]">Members</h2>
          <p className="text-label-sm text-[color:var(--sx-text-subtle)] mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <InviteSection workspaceId={workspaceId} canManageMembers={isAdmin} />
          <AddMemberForm workspaceId={workspaceId} onAdded={load} />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-14 rounded-xl bg-[color:var(--sx-surface)] animate-pulse" />)}
        </div>
      ) : error ? (
        <p className="text-body-md text-[color:var(--sx-danger)] text-center py-8">{error}</p>
      ) : members.length === 0 ? (
        <p className="text-body-md text-[color:var(--sx-text-subtle)] text-center py-8">No members yet</p>
      ) : (
        <Glass variant="panel" depth="raised" className="rounded-xl p-2">
          {members.map(m => (
            <MemberRow
              key={m.user.id}
              member={m}
              currentUserId={userId}
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
            />
          ))}
        </Glass>
      )}
    </div>
  );
};
