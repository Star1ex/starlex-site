import React, { useEffect, useState } from 'react';
import { Tag, Check, ChevronDown, Loader2 } from 'lucide-react';
import { workspaceService } from '@/services/api/index.js';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TaskLabelDTO, WorkspaceLabelDTO } from '@/types/dto.js';

interface LabelPickerProps {
  workspaceId: string;
  selected: TaskLabelDTO[];
  onChange: (labels: TaskLabelDTO[]) => void;
  disabled?: boolean;
  triggerClassName?: string;
  contentAlign?: 'start' | 'center' | 'end';
  label?: string;
}

export const LabelPicker: React.FC<LabelPickerProps> = ({
  workspaceId,
  selected,
  onChange,
  disabled,
  triggerClassName,
  contentAlign = 'start',
  label,
}) => {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<WorkspaceLabelDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !workspaceId) return;
    let cancelled = false;
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setLoading(true);
    }, 0);
    workspaceService.listLabels(workspaceId)
      .then(list => { if (!cancelled) setLabels(list); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimer);
    };
  }, [open, workspaceId]);

  const isSelected = (id: string) => selected.some(l => l.id === id);

  const toggle = (label: WorkspaceLabelDTO) => {
    if (isSelected(label.id)) {
      onChange(selected.filter(l => l.id !== label.id));
    } else {
      onChange([...selected, { id: label.id, name: label.name, color: label.color }]);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={(next) => { if (!disabled) setOpen(next); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={triggerClassName ?? 'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[color:var(--sx-text-subtle)] hover:text-[color:var(--sx-text)] hover:bg-[color:var(--sx-control)] transition-colors text-sm disabled:opacity-40'}
          title="Labels"
        >
          <Tag size={13} />
          {label && <span>{label}</span>}
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
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={contentAlign}
        className="glass-menu min-w-[220px] max-h-72 rounded-xl p-1.5"
      >
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={14} className="animate-spin text-[color:var(--sx-text-subtle)]" />
          </div>
        ) : labels.length === 0 ? (
          <p className="px-3 py-2 text-xs text-[color:var(--sx-text-subtle)]">No labels. Create them in Workspace Settings.</p>
        ) : (
          labels.map(workspaceLabel => {
            const active = isSelected(workspaceLabel.id);
            return (
              <DropdownMenuCheckboxItem
                key={workspaceLabel.id}
                checked={active}
                onSelect={(event) => {
                  event.preventDefault();
                  toggle(workspaceLabel);
                }}
                className="glass-menu-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-[color:var(--sx-control)] focus:bg-[color:var(--sx-control)]"
              >
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: workspaceLabel.color }} />
                <span className={`flex-1 truncate ${active ? 'text-[color:var(--sx-text)]' : 'text-[color:var(--sx-text-muted)]'}`}>{workspaceLabel.name}</span>
                {active && <Check size={12} className="text-[color:var(--sx-text-muted)] flex-shrink-0" />}
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
        <span className="text-xs text-[color:var(--sx-text-subtle)]">+{rest}</span>
      )}
    </div>
  );
};
