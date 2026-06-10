import React, { useEffect, useState } from 'react';
import { workspaceService, userService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { showToast } from '@/shared/lib/toast.js';
import { LabelsManager } from './LabelsManager.js';
import { DarkSelect } from '@/shared/ui/DarkSelect.js';
import { TASK_STATUS_META } from '@/entities/task/model/taskMeta.js';
import type { TaskStatus, WorkspaceDTO } from '@/types/dto.js';

const ACCENT_PRESETS = [
  { label: 'Crimson',  value: '#e6455a' },
  { label: 'Violet',   value: '#8b5cf6' },
  { label: 'Sky',      value: '#0ea5e9' },
  { label: 'Emerald',  value: '#10b981' },
  { label: 'Amber',    value: '#f59e0b' },
  { label: 'Rose',     value: '#f43f5e' },
  { label: 'Slate',    value: '#64748b' },
  { label: 'White',    value: '#e2e8f0' },
];

const DEFAULT_TASK_STATUS_VALUES = ['backlog', 'todo', 'in_progress'] as const satisfies readonly TaskStatus[];

const TASK_STATUS_OPTIONS = [
  { value: '', label: `Default (${TASK_STATUS_META.backlog.label.toLowerCase()})` },
  ...DEFAULT_TASK_STATUS_VALUES.map((status) => ({
    value: status,
    label: TASK_STATUS_META[status].label,
  })),
];

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'guest', label: 'Guest (read-only)' },
];

interface FieldProps { label: string; children: React.ReactNode; hint?: string }

function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="settings-field">
      <label className="settings-label">{label}</label>
      {children}
      {hint && <p className="settings-hint">{hint}</p>}
    </div>
  );
}

const inputCls = 'settings-input';

interface WorkspaceSettingsProps {
  onClose?: () => void;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = () => {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<WorkspaceDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#e6455a');
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
        setColor(ws.color ?? '#e6455a');
        setKeyPrefix(ws.key_prefix ?? '');
        setDefaultStatus(ws.default_task_status ?? '');
        setMemberRole(ws.member_default_role ?? 'member');
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
    return <p className="settings-section text-body-md text-[color:var(--sx-text-subtle)] py-8 text-center">No active workspace selected</p>;
  }

  if (loading) {
    return (
      <div className="settings-page animate-pulse">
        {[0,1,2].map(i => <div key={i} className="h-12 rounded-xl bg-[color:var(--sx-control)]" />)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="settings-page settings-page--wide">
      <section className="settings-section">
        <div className="settings-section-header">
          <h3 className="settings-section-title">
            {workspace?.name ?? 'Workspace'} settings
          </h3>
          <p className="settings-section-description">
            Changes apply to all members of this workspace.
          </p>
        </div>

        <div className="grid gap-4">
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
            <div className="flex flex-wrap gap-2 pt-1">
              {ACCENT_PRESETS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className="size-7 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: p.value,
                    boxShadow: color === p.value ? `0 0 0 1px rgba(255,255,255,0.9), 0 0 0 4px ${p.value}44` : undefined,
                  }}
                  title={p.label}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="size-7 rounded-lg cursor-pointer border border-[color:var(--sx-border)] bg-transparent p-0.5"
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
            <DarkSelect
              value={defaultStatus}
              onChange={setDefaultStatus}
              options={TASK_STATUS_OPTIONS}
              disabled={saving}
              className={`${inputCls} h-11 cursor-pointer`}
            />
          </Field>

          <Field label="Default member role" hint="Role assigned when a new member accepts an invite">
            <DarkSelect
              value={memberRole}
              onChange={setMemberRole}
              options={ROLE_OPTIONS}
              disabled={saving}
              className={`${inputCls} h-11 cursor-pointer`}
            />
          </Field>
        </div>

        {error && <p className="settings-message settings-message--error mt-4">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="settings-button settings-button--primary mt-5"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </section>

      {activeWorkspaceId && (
        <LabelsManager
          workspaceId={activeWorkspaceId}
          isAdmin={workspace?.role === 'admin' || workspace?.role === 'owner'}
        />
      )}
    </form>
  );
};
