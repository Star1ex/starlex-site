import { memo, useState } from 'react';
import { GenerativeAvatar } from './GenerativeAvatar.js';
import { hexToHue } from '@/shared/lib/generativeAvatar.js';
import { resolveWorkspaceIcon } from '@/shared/lib/workspaceAvatar.js';

interface WorkspaceAvatarProps {
  /** Stable seed for the generative composition (workspace id, or name). */
  seed: string;
  /** Display name — used for legacy glyph fallback + alt text. */
  name?: string;
  /** Raw `workspace.icon` token. */
  icon?: string | null;
  /** Accent colour (#hex) — drives the generative hue. */
  color?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

function legacyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

/**
 * Single source of truth for "what a workspace looks like". Decides between an
 * uploaded image, a legacy glyph, or the deterministic generative avatar.
 */
export const WorkspaceAvatar = memo(function WorkspaceAvatar({
  seed,
  name = '',
  icon,
  color,
  size = 28,
  className = '',
  style = {},
}: WorkspaceAvatarProps) {
  const resolved = resolveWorkspaceIcon(icon);
  const [imgFailed, setImgFailed] = useState(false);
  const hue = hexToHue(color || undefined);

  if (resolved.kind === 'image' && resolved.url && !imgFailed) {
    return (
      <img
        src={resolved.url}
        alt={`${name} workspace`}
        width={size}
        height={size}
        className={className}
        style={{ borderRadius: size * 0.28, objectFit: 'cover', flexShrink: 0, display: 'block', ...style }}
        onError={() => setImgFailed(true)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  if (resolved.kind === 'glyph' && resolved.glyph) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.28,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: color || 'var(--sx-accent)',
          color: 'var(--sx-accent-contrast)',
          fontSize: size * 0.42,
          fontWeight: 700,
          lineHeight: 1,
          ...style,
        }}
        aria-label={`${name} workspace`}
      >
        <span style={{ lineHeight: 1 }}>{resolved.glyph || legacyInitials(name)}</span>
      </div>
    );
  }

  return (
    <GenerativeAvatar
      seed={seed}
      hue={hue}
      variant={resolved.variant}
      size={size}
      className={className}
      style={style}
    />
  );
});

export default WorkspaceAvatar;
