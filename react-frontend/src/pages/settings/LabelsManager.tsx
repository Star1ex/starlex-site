import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/useWorkspace.js';
import { showToast } from '@/shared/lib/toast.js';
import type { WorkspaceLabelDTO } from '@/types/dto.js';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#0ea5e9', '#64748b', '#a3a3a3', '#e2e8f0',
];

const inputCls = 'settings-input !py-1.5 !text-sm';

interface RowProps {
  label: WorkspaceLabelDTO;
  onUpdated: (l: WorkspaceLabelDTO) => void;
  onDeleted: (id: string) => void;
  workspaceId: string;
}

function LabelRow({ label, onUpdated, onDeleted, workspaceId }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setName(label.name);
    setColor(label.color);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const cancel = () => {
    setEditing(false);
    setName(label.name);
    setColor(label.color);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const updated = await workspaceService.updateLabel(workspaceId, label.id, { name: trimmed, color });
      onUpdated(updated);
      setEditing(false);
    } catch {
      showToast('Failed to update label', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await workspaceService.deleteLabel(workspaceId, label.id);
      onDeleted(label.id);
    } catch {
      showToast('Failed to delete label', 'error');
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="settings-row !items-center !py-2">
        <div className="relative flex-shrink-0">
          <div className="size-5 rounded-full cursor-pointer border border-[color:var(--sx-border)] overflow-hidden">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-full h-full rounded-full" style={{ background: color }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-0">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="size-3.5 rounded-full flex-shrink-0 transition-transform hover:scale-125"
              style={{
                background: c,
                boxShadow: color === c ? `0 0 0 1.5px white` : undefined,
              }}
            />
          ))}
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          className={`${inputCls} flex-1 min-w-0`}
          placeholder="Label name"
          disabled={saving}
        />
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="size-7 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-40"
        >
          <Check size={14} />
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="size-7 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group settings-row !py-2.5">
      <span className="size-4 rounded-full flex-shrink-0" style={{ background: label.color }} />
      <span className="flex-1 text-body-md text-[color:var(--sx-text)] truncate">{label.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={startEdit}
          className="size-7 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="size-7 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-red-400 transition-colors disabled:opacity-40"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

interface CreateRowProps {
  workspaceId: string;
  onCreated: (l: WorkspaceLabelDTO) => void;
}

function CreateRow({ workspaceId, onCreated }: CreateRowProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setOpen(true);
    setName('');
    setColor(PRESET_COLORS[0]);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const cancel = () => { setOpen(false); setName(''); };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const created = await workspaceService.createLabel(workspaceId, { name: trimmed, color });
      onCreated(created);
      setOpen(false);
      setName('');
      showToast('Label created', 'success');
    } catch {
      showToast('Failed to create label', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={openCreate}
        className="settings-button !w-full !justify-start !bg-transparent !border-transparent"
      >
        <Plus size={14} />
        Add label
      </button>
    );
  }

  return (
    <div className="settings-row !items-center !py-2">
      <div className="relative flex-shrink-0">
        <div className="size-5 rounded-full border border-[color:var(--sx-border)] overflow-hidden cursor-pointer">
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="w-full h-full rounded-full" style={{ background: color }} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {PRESET_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className="size-3.5 rounded-full flex-shrink-0 transition-transform hover:scale-125"
            style={{ background: c, boxShadow: color === c ? `0 0 0 1.5px white` : undefined }}
          />
        ))}
      </div>
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
        className={`${inputCls} flex-1 min-w-0`}
        placeholder="Label name"
        disabled={saving}
      />
      <button
        onClick={save}
        disabled={saving || !name.trim()}
        className="size-7 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-40"
      >
        <Check size={14} />
      </button>
      <button
        onClick={cancel}
        disabled={saving}
        className="size-7 flex items-center justify-center rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

interface LabelsManagerProps {
  workspaceId: string;
  isAdmin: boolean;
}

export const LabelsManager: React.FC<LabelsManagerProps> = ({ workspaceId, isAdmin }) => {
  const [labels, setLabels] = useState<WorkspaceLabelDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    workspaceService.listLabels(workspaceId)
      .then(list => { if (!cancelled) setLabels(list); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [workspaceId]);

  const handleUpdated = (updated: WorkspaceLabelDTO) => {
    setLabels(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const handleDeleted = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
  };

  const handleCreated = (created: WorkspaceLabelDTO) => {
    setLabels(prev => [...prev, created]);
  };

  return (
    <section className="settings-section settings-section--subtle">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="settings-section-title">Labels</h3>
          <p className="settings-section-description">Reusable tags for tasks in this workspace.</p>
        </div>
        <span className="settings-status-pill">{labels.length} labels</span>
      </div>

      {!isAdmin && (
        <p className="settings-hint py-3">Only admins can manage labels.</p>
      )}

      {loading ? (
        <div className="space-y-1.5 animate-pulse">
          {[0, 1, 2].map(i => <div key={i} className="h-9 rounded-xl bg-[color:var(--sx-control)]" />)}
        </div>
      ) : (
        <div className="space-y-1.5">
          {labels.length === 0 && !isAdmin && (
            <p className="settings-hint py-2 px-3">No labels yet</p>
          )}
          {labels.map(l => (
            <LabelRow
              key={l.id}
              label={l}
              workspaceId={workspaceId}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
          {isAdmin && <CreateRow workspaceId={workspaceId} onCreated={handleCreated} />}
        </div>
      )}
    </section>
  );
};

export const LabelsManagerSection: React.FC = () => {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const role = activeWorkspace?.role;
  const isAdmin = role === 'admin' || role === 'owner';

  if (!activeWorkspaceId) return null;

  return <LabelsManager workspaceId={activeWorkspaceId} isAdmin={isAdmin} />;
};
