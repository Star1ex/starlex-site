import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { can } from '@/shared/lib/permissions.js';
import { showToast } from '@/shared/lib/toast.js';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog.js';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog.js';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select.js';
import type { WorkspaceMemberDTO, WorkspaceRole } from '@/types/dto.js';
import { copyTextToClipboard } from '@/shared/lib/clipboard.js';
import { MemberRoleBadge } from './MemberRoleBadge.js';
import {
  EDITABLE_MEMBER_ROLES,
  MEMBER_ROLE_META,
  formatMemberJoinedDate,
  getApiErrorMessage,
  getMemberAvatarSrc,
  getMemberInitials,
} from './memberRoleData.js';

export const MembersPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { activeWorkspace } = useWorkspace();
  const myRole = activeWorkspace?.role;
  const canManage = can.manageMembers(myRole);

  const [members, setMembers] = useState<WorkspaceMemberDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<WorkspaceRole>('member');
  const [addLoading, setAddLoading] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<WorkspaceMemberDTO | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<number | null>(null);

  const loadMembers = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    workspaceService.listMembers(workspaceId)
      .then(setMembers)
      .catch(() => showToast('Failed to load members'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  useEffect(() => () => {
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
  }, []);

  const handleRoleChange = useCallback(async (userId: string, role: WorkspaceRole) => {
    if (!workspaceId) return;
    const prev = members.find((m) => m.user.id === userId);
    setMembers((ms) => ms.map((m) => m.user.id === userId ? { ...m, role } : m));
    try {
      await workspaceService.updateMemberRole(workspaceId, userId, role);
    } catch {
      if (prev) setMembers((ms) => ms.map((m) => m.user.id === userId ? prev : m));
      showToast('Failed to update role');
    }
  }, [workspaceId, members]);

  const handleRemove = useCallback(async () => {
    if (!workspaceId || !removeTarget) return;
    const userId = removeTarget.user.id;
    setRemovingId(userId);
    setRemoveTarget(null);
    try {
      await workspaceService.removeMember(workspaceId, userId);
      setMembers((ms) => ms.filter((m) => m.user.id !== userId));
      showToast('Member removed');
    } catch {
      showToast('Failed to remove member');
    } finally {
      setRemovingId(null);
    }
  }, [workspaceId, removeTarget]);

  const handleAdd = useCallback(async () => {
    if (!workspaceId || !addEmail.trim()) return;
    setAddLoading(true);
    try {
      await workspaceService.addMember(workspaceId, addEmail.trim(), addRole);
      await workspaceService.listMembers(workspaceId).then(setMembers);
      setAddEmail('');
      setAddOpen(false);
      showToast('Member added');
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Failed to add member'));
    } finally {
      setAddLoading(false);
    }
  }, [workspaceId, addEmail, addRole]);

  const handleGenerateInvite = useCallback(async () => {
    if (!workspaceId) return;
    setInviteLoading(true);
    try {
      const invite = await workspaceService.createInvite(workspaceId, inviteRole);
      setInviteUrl(invite.url || `${window.location.origin}/invite/${invite.token}`);
    } catch {
      showToast('Failed to generate invite link');
    } finally {
      setInviteLoading(false);
    }
  }, [workspaceId, inviteRole]);

  const handleCopy = useCallback(() => {
    if (!inviteUrl) return;
    copyTextToClipboard(inviteUrl).then(() => {
      setCopied(true);
      showToast('Invite link copied!');
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => showToast('Failed to copy invite link'));
  }, [inviteUrl]);

  const ownerCount = members.filter((m) => m.role === 'owner').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-md font-hanken font-semibold text-[color:var(--sx-text)]">Members</h1>
          <p className="text-body-sm text-[color:var(--sx-text-subtle)] mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setAddOpen(true)}
            className="liquid-button flex items-center gap-1.5 px-3 py-1.5 text-label-sm"
          >
            <Plus size={13} /> Add member
          </button>
        )}
      </div>

      {/* Members list */}
      <div className="members-list-shell">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-[color:var(--sx-text-subtle)] animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-body-md text-[color:var(--sx-text-subtle)]">No members yet</p>
          </div>
        ) : (
          members.map((m) => {
            const src = getMemberAvatarSrc(m.user);
            const ini = getMemberInitials(m.user);
            const isOwner = m.role === 'owner';
            const isLastOwner = isOwner && ownerCount <= 1;
            const isRemoving = removingId === m.user.id;
            return (
              <div
                key={m.user.id}
                className={`members-row ${isRemoving ? 'opacity-40' : ''}`}
              >
                {/* Avatar */}
                <div className="members-avatar">
                  {src ? <img src={src} alt={ini} /> : ini}
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-[color:var(--sx-text)] font-medium truncate">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="text-[10px] text-[color:var(--sx-text-subtle)] truncate">{m.user.email}</p>
                </div>

                {/* Joined */}
                <span className="hidden sm:block text-[10px] text-[color:var(--sx-text-subtle)] flex-shrink-0">
                  {formatMemberJoinedDate(m.joined_at)}
                </span>

                {/* Role badge / selector */}
                {canManage && !isOwner ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.user.id, v as WorkspaceRole)}
                  >
                    <SelectTrigger className="w-[100px] h-7 glass-input text-label-sm px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-menu rounded-xl p-1">
                      {EDITABLE_MEMBER_ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="glass-menu-item text-label-sm hover:text-[color:var(--sx-text)] focus:text-[color:var(--sx-text)]">
                          {MEMBER_ROLE_META[r].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <MemberRoleBadge role={m.role} />
                )}

                {/* Remove button */}
                {canManage && !isLastOwner && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    disabled={isRemoving}
                    className="p-1.5 text-[color:var(--sx-text-disabled)] hover:text-[color:var(--sx-danger)] hover:bg-[color:color-mix(in_srgb,var(--sx-danger)_12%,transparent)] rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Invite link section */}
      {canManage && (
        <div className="members-invite-section">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={14} className="text-[color:var(--sx-text-muted)]" />
            <h2 className="text-body-md font-medium text-[color:var(--sx-text)]">Invite link</h2>
          </div>
          <p className="text-body-sm text-[color:var(--sx-text-subtle)] mb-4">
            Generate a link that lets anyone with the URL join this workspace.
          </p>
          <div className="flex items-center gap-3 mb-3">
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as WorkspaceRole)}>
              <SelectTrigger className="w-[120px] h-8 glass-input text-label-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-menu rounded-xl p-1">
                {EDITABLE_MEMBER_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="glass-menu-item text-label-sm">
                    {MEMBER_ROLE_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleGenerateInvite}
              disabled={inviteLoading}
              className="liquid-button flex items-center gap-1.5 px-3 py-1.5 text-label-sm disabled:opacity-50"
            >
              {inviteLoading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
              Generate link
            </button>
          </div>
          {inviteUrl && (
            <div className="members-invite-url">
              <span className="flex-1 text-[11px] text-[color:var(--sx-text-muted)] font-mono truncate">{inviteUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-label-sm text-[color:var(--sx-text-muted)] hover:text-[color:var(--sx-text)] transition-colors flex-shrink-0"
              >
                {copied ? <Check size={13} className="text-[color:var(--status-done-text)]" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Enter the email address and role for the new member.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <input
              type="email"
              placeholder="Email address"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="glass-input w-full px-3 py-2 rounded-xl text-body-sm"
              autoFocus
            />
            <Select value={addRole} onValueChange={(v) => setAddRole(v as WorkspaceRole)}>
              <SelectTrigger className="glass-input text-body-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-menu rounded-xl p-1">
                {EDITABLE_MEMBER_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="glass-menu-item text-label-sm">
                    {MEMBER_ROLE_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-label-sm text-[color:var(--sx-text-muted)] hover:text-[color:var(--sx-text)] transition-colors">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={addLoading || !addEmail.trim()}
              className="liquid-button px-4 py-2 text-label-sm disabled:opacity-50"
            >
              {addLoading ? 'Adding…' : 'Add member'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong className="text-[color:var(--sx-text)]">{removeTarget?.user.firstName} {removeTarget?.user.lastName}</strong> from this workspace? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" className="text-[color:var(--sx-text-muted)] hover:bg-[color:var(--sx-surface-hover)] hover:text-[color:var(--sx-text)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="border-0 bg-[color:var(--sx-danger)] text-white hover:brightness-110"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
