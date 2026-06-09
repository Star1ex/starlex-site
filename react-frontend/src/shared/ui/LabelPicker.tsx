import React, { useEffect, useRef, useState } from 'react';
import { Tag, Check, ChevronDown, Loader2 } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import type { TaskLabelDTO, WorkspaceLabelDTO } from '@/types/dto.js';

interface LabelPickerProps {
  workspaceId: string;
  selected: TaskLabelDTO[];
  onChange: (labels: TaskLabelDTO[]) => void;
  disabled?: boolean;
}

export const LabelPicker: React.FC<LabelPickerProps> = ({ workspaceId, selected, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<WorkspaceLabelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    workspaceService.listLabels(workspaceId)
      .then(list => { if (!cancelled) setLabels(list); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, workspaceId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isSelected = (id: string) => selected.some(l => l.id === id);

  const toggle = (label: WorkspaceLabelDTO) => {
    if (isSelected(label.id)) {
      onChange(selected.filter(l => l.id !== label.id));
    } else {
      onChange([...selected, { id: label.id, name: label.name, color: label.color }]);
    }
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(p => !p); }}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors text-sm disabled:opacity-40"
        title="Labels"
      >
        <Tag size={13} />
        {selected.length > 0 ? (
          <span className="flex items-center gap-1">
            {selected.slice(0, 3).map(l => (
              <span key={l.id} className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            ))}
            {selected.length > 3 && <span className="text-xs">+{selected.length - 3}</span>}
          </span>
        ) : (
          <ChevronDown size={11} className="opacity-60" />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-40 rounded-xl py-1.5 min-w-[180px] max-h-64 overflow-y-auto"
          style={{
            background: 'var(--bg-primary, #000)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin text-white/30" />
            </div>
          ) : labels.length === 0 ? (
            <p className="px-3 py-2 text-xs text-white/30">No labels. Create them in Workspace Settings.</p>
          ) : (
            labels.map(label => {
              const active = isSelected(label.id);
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggle(label)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors hover:bg-white/5"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: label.color }} />
                  <span className={`flex-1 truncate ${active ? 'text-white' : 'text-white/60'}`}>{label.name}</span>
                  {active && <Check size={12} className="text-white/60 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface InlineLabelChipsProps {
  labels: TaskLabelDTO[];
  maxVisible?: number;
}

export const InlineLabelChips: React.FC<InlineLabelChipsProps> = ({ labels, maxVisible = 3 }) => {
  if (!labels || labels.length === 0) return null;
  const visible = labels.slice(0, maxVisible);
  const rest = labels.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map(l => (
        <span
          key={l.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
          style={{
            background: `${l.color}20`,
            color: l.color,
            border: `1px solid ${l.color}40`,
          }}
        >
          {l.name}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-xs text-white/30">+{rest}</span>
      )}
    </div>
  );
};
