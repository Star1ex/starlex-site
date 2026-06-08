import React, { useEffect, useState } from 'react';
import { workspaceService, userService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { showToast } from '@/shared/lib/toast.js';
import type { WorkspaceDTO } from '@/types/dto.js';

const ACCENT_PRESETS = [
  { label: 'Indigo',   value: '#6366f1' },
  { label: 'Violet',   value: '#8b5cf6' },
  { label: 'Sky',      value: '#0ea5e9' },
  { label: 'Emerald',  value: '#10b981' },
  { label: 'Amber',    value: '#f59e0b' },
  { label: 'Rose',     value: '#f43f5e' },
  { label: 'Slate',    value: '#64748b' },
  { label: 'White',    value: '#e2e8f0' },
];

const TASK_STATUS_OPTIONS = [
  { value: '', label: 'Default (backlog)' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
];

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest (read-only)' },
];

interface FieldProps { label: string; children: React.ReactNode; hint?: string }

function Field({ label, children, hint }: FieldProps) {
  return (
    <div>
      <label className="block label-caps text-white/40 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-label-sm text-white/30 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-body-md text-white bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-all disabled:opacity-40 placeholder:text-white/30';

interface WorkspaceSettingsProps {
  onClose?: () => void;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = () => {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<WorkspaceDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeWorkspaceId) { setLoading(false); return; }
    userService.getWorkspaces().then(list => {
      const ws = list.find(w => w.id === activeWorkspaceId) ?? null;
      setWorkspace(ws);
      if (ws) {
        setName(ws.name ?? '');
        setDescription(ws.description ?? '');
        setColor(ws.color ?? '#6366f1');
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeWorkspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !workspace) return;
    const trimmed = name.trim();
    if (!trimmed) { setError('Workspace name is required'); return; }
    setSaving(true); setError('');
    try {
      await workspaceService.patchWorkspaceSettings(activeWorkspaceId, {
        name: trimmed,
        description: description.trim(),
        color,
        key_prefix: keyPrefix.trim() || undefined,
        default_task_status: defaultStatus || undefined,
        member_default_role: memberRole,
      });
      setActiveWorkspace({ ...workspace, name: trimmed, description: description.trim(), color });
      showToast('Workspace settings saved', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!activeWorkspaceId) {
    return <p className="text-body-md text-white/40 py-8 text-center">No active workspace selected</p>;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0,1,2].map(i => <div key={i} className="h-12 rounded-xl bg-white/5" />)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div>
        <h3 className="text-headline-sm font-hanken font-semibold text-white mb-4">
          {workspace?.name ?? 'Workspace'} Settings
        </h3>
        <p className="text-label-sm text-white/40 -mt-2 mb-4">
          Changes apply to all members of this workspace.
        </p>
      </div>

      <Field label="Workspace name">
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          placeholder="My Workspace"
          disabled={saving}
          className={inputCls}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this workspace do?"
          rows={3}
          disabled={saving}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Field label="Accent color">
        <div className="flex flex-wrap gap-2 mt-1">
          {ACCENT_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setColor(p.value)}
              className="w-7 h-7 rounded-lg transition-all hover:scale-110"
              style={{
                background: p.value,
                boxShadow: color === p.value ? `0 0 0 2px #fff, 0 0 0 4px ${p.value}` : undefined,
                outline: color === p.value ? `2px solid ${p.value}` : 'none',
                outlineOffset: color === p.value ? '3px' : undefined,
              }}
              title={p.label}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-7 h-7 rounded-lg cursor-pointer border border-white/20 bg-transparent p-0.5"
            title="Custom color"
          />
        </div>
      </Field>

      <Field label="Key prefix" hint="Used to prefix task keys, e.g. ENG → ENG-1">
        <input
          value={keyPrefix}
          onChange={e => setKeyPrefix(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="e.g. ENG"
          disabled={saving}
          className={`${inputCls} font-mono uppercase`}
          maxLength={6}
        />
      </Field>

      <Field label="Default task status">
        <select value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)} disabled={saving} className={`${inputCls} cursor-pointer`}>
          {TASK_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>

      <Field label="Default member role" hint="Role assigned when a new member accepts an invite">
        <select value={memberRole} onChange={e => setMemberRole(e.target.value)} disabled={saving} className={`${inputCls} cursor-pointer`}>
          {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>

      {error && <p className="text-label-sm text-[#fca5a5]">{error}</p>}

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="liquid-button !bg-[--accent] !border-transparent !text-white font-semibold disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  );
};
