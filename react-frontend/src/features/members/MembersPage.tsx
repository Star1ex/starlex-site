import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, Crown, Eye, Link2, Loader2, Plus, Shield, Trash2, User } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
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

const ROLE_META: Record<WorkspaceRole, { label: string; icon: React.ReactNode; cls: string }> = {
  owner:  { label: 'Owner',  icon: <Crown size={11} />,  cls: 'text-amber-400 bg-amber-900/25' },
  admin:  { label: 'Admin',  icon: <Shield size={11} />, cls: 'text-violet-400 bg-violet-900/25' },
  member: { label: 'Member', icon: <User size={11} />,   cls: 'text-blue-400 bg-blue-900/25' },
  guest:  { label: 'Guest',  icon: <Eye size={11} />,    cls: 'text-white/40 bg-white/5' },
};

const ROLES: WorkspaceRole[] = ['admin', 'member', 'guest'];

function RoleBadge({ role }: { role: WorkspaceRole }) {
  const m = ROLE_META[role] ?? ROLE_META.member;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium ${m.cls}`}>
      {m.icon}{m.label}
    </span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function apiErrorMessage(error: unknown, fallback: string) {
  return (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
    ?? (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    ?? fallback;
}

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

  const loadMembers = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    workspaceService.listMembers(workspaceId)
      .then(setMembers)
      .catch(() => showToast('Failed to load members'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

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
      showToast(apiErrorMessage(err, 'Failed to add member'));
    } finally {
      setAddLoading(false);
    }
  }, [workspaceId, addEmail, addRole]);

  const handleGenerateInvite = useCallback(async () => {
    if (!workspaceId) return;
    setInviteLoading(true);
    try {
      const { url } = await workspaceService.createInvite(workspaceId, inviteRole);
      setInviteUrl(url);
    } catch {
      showToast('Failed to generate invite link');
    } finally {
      setInviteLoading(false);
    }
  }, [workspaceId, inviteRole]);

  const handleCopy = useCallback(() => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      showToast('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  }, [inviteUrl]);

  const ownerCount = members.filter((m) => m.role === 'owner').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline-md font-hanken font-semibold text-white">Members</h1>
          <p className="text-body-sm text-white/40 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
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
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-body-md text-white/30">No members yet</p>
          </div>
        ) : (
          members.map((m, i) => {
            const src = m.user.photo_url ?? m.user.avatar_url ?? undefined;
            const ini = [m.user.firstName?.[0], m.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
            const isOwner = m.role === 'owner';
            const isLastOwner = isOwner && ownerCount <= 1;
            const isRemoving = removingId === m.user.id;
            return (
              <div
                key={m.user.id}
                className={`flex items-center gap-3 px-5 py-3.5 ${i < members.length - 1 ? 'border-b border-white/5' : ''} ${isRemoving ? 'opacity-40' : ''} transition-opacity`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden flex-shrink-0">
                  {src ? <img src={src} alt={ini} className="w-full h-full object-cover" /> : ini}
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-white font-medium truncate">
                    {m.user.firstName} {m.user.lastName}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">{m.user.email}</p>
                </div>

                {/* Joined */}
                <span className="hidden sm:block text-[10px] text-white/30 flex-shrink-0">
                  {fmtDate(m.joined_at)}
                </span>

                {/* Role badge / selector */}
                {canManage && !isOwner ? (
                  <Select
                    value={m.role}
                    onValueChange={(v) => handleRoleChange(m.user.id, v as WorkspaceRole)}
                  >
                    <SelectTrigger className="w-[100px] h-7 glass-input border-white/10 text-label-sm px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-menu rounded-xl p-1">
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="glass-menu-item text-label-sm hover:text-white focus:text-white">
                          {ROLE_META[r].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <RoleBadge role={m.role} />
                )}

                {/* Remove button */}
                {canManage && !isLastOwner && (
                  <button
                    onClick={() => setRemoveTarget(m)}
                    disabled={isRemoving}
                    className="p-1.5 text-white/25 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
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
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 size={14} className="text-white/50" />
            <h2 className="text-body-md font-medium text-white">Invite link</h2>
          </div>
          <p className="text-body-sm text-white/40 mb-4">
            Generate a link that lets anyone with the URL join this workspace.
          </p>
          <div className="flex items-center gap-3 mb-3">
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as WorkspaceRole)}>
              <SelectTrigger className="w-[120px] h-8 glass-input border-white/10 text-label-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-menu rounded-xl p-1">
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="glass-menu-item text-label-sm">
                    {ROLE_META[r].label}
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/8">
              <span className="flex-1 text-[11px] text-white/60 font-mono truncate">{inviteUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-label-sm text-white/50 hover:text-white transition-colors flex-shrink-0"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add member dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-card border-white/10 bg-black/80 backdrop-blur-2xl text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-hanken">Add member</DialogTitle>
            <DialogDescription className="text-white/50">
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
              <SelectTrigger className="glass-input border-white/10 text-body-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-menu rounded-xl p-1">
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="glass-menu-item text-label-sm">
                    {ROLE_META[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-label-sm text-white/50 hover:text-white/80 transition-colors">
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
        <AlertDialogContent className="glass-card border-white/10 bg-black/80 backdrop-blur-2xl text-white sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-hanken">Remove member</AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              Remove <strong className="text-white/80">{removeTarget?.user.firstName} {removeTarget?.user.lastName}</strong> from this workspace? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 text-white/60 hover:bg-white/8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600/80 hover:bg-red-600 text-white border-0"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
