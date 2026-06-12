// Interpretation of the `workspace.icon` string. Kept backend-agnostic: we
// overload the existing free-text `icon` column instead of adding schema, so
// nothing on the server changes.
//
//   ''                 → generative avatar (default)
//   'gen:<variant>'    → generative avatar, geometry salted by <variant>
//   '/uploads/…' | http→ uploaded image (reserved for future upload flow)
//   '<emoji>' | '<XX>' → legacy 1–2 char glyph (existing workspaces)

export type WorkspaceIconKind = 'generative' | 'image' | 'glyph';

export interface WorkspaceIconResolved {
  kind: WorkspaceIconKind;
  /** generative geometry salt */
  variant: number;
  /** image url */
  url?: string;
  /** legacy glyph text */
  glyph?: string;
}

const GEN_PREFIX = 'gen:';

export function resolveWorkspaceIcon(icon?: string | null): WorkspaceIconResolved {
  const value = (icon ?? '').trim();
  if (!value) return { kind: 'generative', variant: 0 };

  if (value.startsWith(GEN_PREFIX)) {
    const n = parseInt(value.slice(GEN_PREFIX.length), 10);
    return { kind: 'generative', variant: Number.isFinite(n) ? n : 0 };
  }
  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return { kind: 'image', variant: 0, url: value };
  }
  return { kind: 'glyph', variant: 0, glyph: value };
}

export function buildGenerativeIcon(variant: number): string {
  return `${GEN_PREFIX}${variant}`;
}

/** Number of distinct geometry salts cycled by the "regenerate" control. */
export const GENERATIVE_VARIANTS = 12;
