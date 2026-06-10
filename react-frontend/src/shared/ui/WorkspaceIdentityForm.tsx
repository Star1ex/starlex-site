import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { WORKSPACE_ACCENT_PRESETS, WORKSPACE_ICON_PRESETS } from '@/shared/lib/workspaceIdentity.js';

function fallbackIcon(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || 'WS';
}

function normalizeIcon(value: string) {
  return value.trim().slice(0, 2).toUpperCase();
}

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
  const previewIcon = icon || fallbackIcon(name);

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => nameRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  return (
    <div className="workspace-identity-form">
      <div className="workspace-identity-preview">
        <div className="workspace-identity-glyph" style={{ backgroundColor: color }}>
          {previewIcon}
        </div>
        <div className="workspace-identity-copy">
          <strong>{name.trim() || 'My Workspace'}</strong>
          <span>Workspace</span>
        </div>
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
        <label>Icon</label>
        <div className="workspace-icon-row">
          <input
            value={icon}
            onChange={(event) => onIconChange(normalizeIcon(event.target.value))}
            placeholder={fallbackIcon(name)}
            disabled={disabled}
            className="workspace-icon-input"
            autoComplete="off"
            maxLength={2}
          />
          <div className="workspace-icon-presets">
            {WORKSPACE_ICON_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onIconChange(preset)}
                disabled={disabled}
                data-active={icon === preset ? 'true' : undefined}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="workspace-identity-field">
        <label>Accent color</label>
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
