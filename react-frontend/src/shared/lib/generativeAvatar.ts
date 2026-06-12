// Generative workspace avatar — deterministic geometric composition.
//
// Goal (per product brief): replace plain initials with a "random but stable"
// picture, like Claude's pixel avatars, rendered as geometric shapes with thin
// lines on top, all in a single harmonious hue. It must be ultra-cheap:
//   • pure + deterministic  → same seed ⇒ same picture, forever
//   • no canvas / no network → tiny inline SVG, GPU-trivial
//   • computed once, memoised → re-renders cost nothing
//
// We persist only a seed + variant; the hue comes from the workspace accent
// (so "one colour once generated"), and "regenerate" only re-salts the
// geometry, never the colour.

import { createRng, hueFromString, type Rng } from './prng.js';

export interface AvatarShape {
  kind: 'circle' | 'rect' | 'triangle' | 'ring';
  /** SVG path or shape attributes pre-resolved for rendering. */
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  rotate?: number;
  rx?: number;
  fill: string;
  opacity: number;
}

export interface AvatarLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  width: number;
  opacity: number;
}

export interface AvatarSpec {
  /** stable id suffix so multiple instances don't collide on <defs> ids */
  id: string;
  hue: number;
  bgFrom: string;
  bgTo: string;
  shapes: AvatarShape[];
  lines: AvatarLine[];
}

const SIZE = 64;

function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
}

/** Parse a #rrggbb / #rgb accent into a hue, or undefined if not a hex. */
export function hexToHue(hex?: string): number | undefined {
  if (!hex) return undefined;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return undefined;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return undefined; // achromatic accent → fall back to seed hue
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = Math.round(hue * 60);
  return ((hue % 360) + 360) % 360;
}

function trianglePath(cx: number, cy: number, size: number, rotate: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const a = rotate + (i * 2 * Math.PI) / 3;
    pts.push(`${(cx + Math.cos(a) * size).toFixed(1)},${(cy + Math.sin(a) * size).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function buildShape(rng: Rng, hue: number): AvatarShape {
  // Shapes are allowed to overflow the tile (clipped) for a cropped,
  // editorial composition rather than timid centred dots.
  const cx = rng.range(4, SIZE - 4);
  const cy = rng.range(4, SIZE - 4);
  // Analogous family: small hue drift keeps everything in one colour story.
  const hShift = rng.pick([-26, -14, 0, 0, 14, 28]);
  const tone = rng.pick([
    { s: 70, l: 70 },
    { s: 64, l: 60 },
    { s: 72, l: 52 },
    { s: 58, l: 44 },
  ]);
  const fill = hsl(hue + hShift, tone.s, tone.l);
  const opacity = rng.range(0.55, 0.92);
  const kind = rng.pick(['circle', 'rect', 'triangle', 'ring'] as const);

  if (kind === 'circle' || kind === 'ring') {
    return { kind, cx, cy, r: rng.range(13, 28), fill, opacity };
  }
  if (kind === 'triangle') {
    return {
      kind,
      d: trianglePath(cx, cy, rng.range(16, 30), rng.range(0, Math.PI * 2)),
      fill,
      opacity,
    };
  }
  const w = rng.range(22, 40);
  const h = rng.range(22, 40);
  return {
    kind: 'rect',
    x: cx - w / 2,
    y: cy - h / 2,
    w,
    h,
    rx: rng.range(4, 14),
    rotate: rng.int(0, 1) ? rng.range(-22, 22) : 0,
    fill,
    opacity,
  };
}

function buildLine(rng: Rng): AvatarLine {
  // Full-bleed strokes crossing the tile — the "lines on top" of the brief.
  const edge = rng.int(0, 3);
  const t1 = rng.range(0.1, 0.9) * SIZE;
  const t2 = rng.range(0.1, 0.9) * SIZE;
  let x1: number, y1: number, x2: number, y2: number;
  if (edge % 2 === 0) {
    x1 = t1; y1 = -2; x2 = t2; y2 = SIZE + 2;
  } else {
    x1 = -2; y1 = t1; x2 = SIZE + 2; y2 = t2;
  }
  return {
    x1, y1, x2, y2,
    stroke: rng.chance(0.7) ? '#ffffff' : '#0a0a0f',
    width: rng.range(1, 2.6),
    opacity: rng.range(0.14, 0.34),
  };
}

const cache = new Map<string, AvatarSpec>();
const CACHE_LIMIT = 256;

/**
 * Build (or recall) the deterministic avatar spec.
 * @param seed   stable seed — workspace id (or name before an id exists)
 * @param hue    accent hue 0–359; when omitted, derived from the seed
 * @param variant geometry salt — bumped by "regenerate", colour stays put
 */
export function buildAvatarSpec(seed: string, hue?: number, variant = 0): AvatarSpec {
  const baseHue = hue ?? hueFromString(seed);
  const key = `${seed}|${baseHue}|${variant}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const rng = createRng(`${seed}#${variant}`);
  const shapeCount = rng.int(3, 4);
  const shapes: AvatarShape[] = [];
  for (let i = 0; i < shapeCount; i++) shapes.push(buildShape(rng, baseHue));
  const lineCount = rng.int(2, 3);
  const lines: AvatarLine[] = [];
  for (let i = 0; i < lineCount; i++) lines.push(buildLine(rng));

  const spec: AvatarSpec = {
    id: key.replace(/[^a-z0-9]/gi, ''),
    hue: baseHue,
    bgFrom: hsl(baseHue, 56, 50),
    bgTo: hsl(baseHue + 22, 64, 38),
    shapes,
    lines,
  };

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, spec);
  return spec;
}

export const AVATAR_VIEWBOX = SIZE;
