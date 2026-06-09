import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import { useWorkspace } from '@/contexts/WorkspaceContext.js';
import { showToast } from '@/shared/lib/toast.js';
import type { WorkspaceLabelDTO } from '@/types/dto.js';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#10b981', '#14b8a6',
  '#0ea5e9', '#64748b', '#a3a3a3', '#e2e8f0',
];

const inputCls = 'px-2.5 py-1.5 rounded-lg text-body-md text-white bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-all placeholder:text-white/30 text-sm';

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
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/8">
        <div className="relative flex-shrink-0">
          <div className="w-5 h-5 rounded-full cursor-pointer border-2 border-white/20 overflow-hidden">
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
              className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform hover:scale-125"
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
          className="w-7 h-7 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-40"
        >
          <Check size={14} />
        </button>
        <button
          onClick={cancel}
          disabled={saving}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors">
      <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: label.color }} />
      <span className="flex-1 text-body-md text-white/80 truncate">{label.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={startEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
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
        className="flex items-center gap-2 px-3 py-2 text-label-sm text-white/40 hover:text-white/70 hover:bg-white/3 rounded-xl transition-colors w-full"
      >
        <Plus size={14} />
        Add label
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/8">
      <div className="relative flex-shrink-0">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 overflow-hidden cursor-pointer">
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
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform hover:scale-125"
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
        className="w-7 h-7 flex items-center justify-center rounded-lg text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-40"
      >
        <Check size={14} />
      </button>
      <button
        onClick={cancel}
        disabled={saving}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
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
    <div className="mt-8 pt-6 border-t border-white/8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="label-caps text-white/40">Labels</h3>
        <span className="text-label-sm text-white/30">{labels.length} labels</span>
      </div>

      {!isAdmin && (
        <p className="text-label-sm text-white/30 py-3">Only admins can manage labels.</p>
      )}

      {loading ? (
        <div className="space-y-1.5 animate-pulse">
          {[0, 1, 2].map(i => <div key={i} className="h-9 rounded-xl bg-white/4" />)}
        </div>
      ) : (
        <div className="space-y-0.5">
          {labels.length === 0 && !isAdmin && (
            <p className="text-label-sm text-white/30 py-2 px-3">No labels yet</p>
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
    </div>
  );
};

export const LabelsManagerSection: React.FC = () => {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const role = activeWorkspace?.role;
  const isAdmin = role === 'admin' || role === 'owner';

  if (!activeWorkspaceId) return null;

  return <LabelsManager workspaceId={activeWorkspaceId} isAdmin={isAdmin} />;
};
