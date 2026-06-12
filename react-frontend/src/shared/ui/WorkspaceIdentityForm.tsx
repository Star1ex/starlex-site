import React, { useEffect, useRef } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { WORKSPACE_ACCENT_PRESETS } from '@/shared/lib/workspaceIdentity.js';
import { WorkspaceAvatar } from '@/shared/ui/WorkspaceAvatar.js';
import {
  buildGenerativeIcon,
  resolveWorkspaceIcon,
  GENERATIVE_VARIANTS,
} from '@/shared/lib/workspaceAvatar.js';

interface WorkspaceIdentityFormProps {
  name: string;
  onNameChange: (value: string) => void;
  icon: string;
  onIconChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showDescription?: boolean;
}

export const WorkspaceIdentityForm: React.FC<WorkspaceIdentityFormProps> = ({
  name,
  onNameChange,
  icon,
  onIconChange,
  color,
  onColorChange,
  description = '',
  onDescriptionChange,
  error,
  disabled,
  autoFocus,
  showDescription = false,
}) => {
  const nameRef = useRef<HTMLInputElement>(null);
  const seed = name.trim() || 'workspace';

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => nameRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const regenerate = () => {
    const current = resolveWorkspaceIcon(icon).variant;
    const next = (current + 1) % GENERATIVE_VARIANTS;
    onIconChange(buildGenerativeIcon(next));
  };

  return (
    <div className="workspace-identity-form">
      <div className="workspace-identity-preview">
        <WorkspaceAvatar seed={seed} name={name} icon={icon} color={color} size={64} />
        <div className="workspace-identity-copy">
          <strong>{name.trim() || 'My Workspace'}</strong>
          <span>Workspace</span>
        </div>
        <button
          type="button"
          className="workspace-avatar-regen"
          onClick={regenerate}
          disabled={disabled}
          title="Regenerate avatar"
          aria-label="Regenerate avatar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="workspace-identity-field">
        <label>Workspace name</label>
        <input
          ref={nameRef}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="e.g. Acme Engineering"
          disabled={disabled}
          className="workspace-identity-input"
          autoComplete="off"
          maxLength={60}
        />
      </div>

      <div className="workspace-identity-field">
        <label>
          Color
          <span>tints the avatar</span>
        </label>
        <div className="workspace-color-presets">
          {WORKSPACE_ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onColorChange(preset.value)}
              title={preset.label}
              aria-label={preset.label}
              aria-pressed={color === preset.value}
              disabled={disabled}
              data-active={color === preset.value ? 'true' : undefined}
              style={{ ['--workspace-swatch' as string]: preset.value }}
            >
              {color === preset.value && <Check size={13} />}
            </button>
          ))}
        </div>
      </div>

      {showDescription && onDescriptionChange && (
        <div className="workspace-identity-field">
          <label>
            Description
            <span>optional</span>
          </label>
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="What is this workspace for?"
            rows={3}
            disabled={disabled}
            className="workspace-identity-input workspace-identity-textarea"
          />
        </div>
      )}

      {error && <p className="workspace-identity-error">{error}</p>}
    </div>
  );
};
