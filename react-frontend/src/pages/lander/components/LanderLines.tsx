import { useMemo } from 'react';
import type { CSSProperties } from 'react';

/* Branching structures — trees / root systems whose limbs fork and run off
   toward the edges. Procedurally grown (seeded, so they're stable), drawn in
   on mount and left to sway very slowly like branches in faint air. No cursor
   glow: the design is the lines themselves. */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Seg { d: string; w: number; o: number; hue: boolean; delay: number; }
interface Tree { x: number; y: number; angle: number; len: number; seed: number; sway: number; dur: number; }

/* roots pinned to the edges, growing inward across a 1600×900 field */
const TREES: Tree[] = [
  { x: -30, y: 950, angle: -56, len: 270, seed: 7, sway: 1.1, dur: 17 },
  { x: 1630, y: 300, angle: 198, len: 250, seed: 23, sway: 0.8, dur: 21 },
  { x: 520, y: -30, angle: 76, len: 220, seed: 51, sway: 1.3, dur: 15 },
  { x: 1630, y: 970, angle: -124, len: 260, seed: 92, sway: 0.9, dur: 19 },
  { x: -30, y: 470, angle: -8, len: 240, seed: 138, sway: 1.0, dur: 23 },
];

const DEPTH = 4;

function buildTree(t: Tree): Seg[] {
  const rnd = mulberry32(t.seed);
  const segs: Seg[] = [];

  const grow = (x: number, y: number, angDeg: number, len: number, depth: number) => {
    if (depth <= 0 || len < 14) return;
    const ang = (angDeg * Math.PI) / 180;
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    // curve each limb a little, perpendicular to its run, for organic shape
    const mx = (x + ex) / 2;
    const my = (y + ey) / 2;
    const curve = (rnd() - 0.5) * 0.45 * len;
    const px = Math.cos(ang + Math.PI / 2) * curve;
    const py = Math.sin(ang + Math.PI / 2) * curve;
    segs.push({
      d: `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(mx + px).toFixed(1)} ${(my + py).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
      w: Math.max(0.55, depth * 0.6),
      o: 0.06 + depth * 0.032,
      hue: depth <= 1 && rnd() < 0.5,
      delay: (DEPTH - depth) * 0.16,
    });
    const kids = rnd() < 0.4 ? 3 : 2;
    const spread = 17 + rnd() * 15;
    for (let i = 0; i < kids; i++) {
      const off = i / (kids - 1) - 0.5;
      const jitter = (rnd() - 0.5) * 13;
      grow(ex, ey, angDeg + off * spread * 2 + jitter, len * (0.68 + rnd() * 0.1), depth - 1);
    }
  };

  grow(t.x, t.y, t.angle, t.len, DEPTH);
  return segs;
}

export function LanderLines() {
  const trees = useMemo(() => TREES.map((t) => ({ t, segs: buildTree(t) })), []);

  return (
    <div className="lx-lines" aria-hidden>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        {trees.map(({ t, segs }, ti) => (
          <g
            key={ti}
            className="lx-tree-grp"
            style={{
              transformBox: 'view-box',
              transformOrigin: `${t.x}px ${t.y}px`,
              '--sway': `${t.sway}deg`,
              animationDuration: `${t.dur}s`,
              animationDelay: `${ti * -3}s`,
            } as CSSProperties}
          >
            {segs.map((s, si) => (
              <path
                key={si}
                d={s.d}
                pathLength={1}
                className={`lx-branch ${s.hue ? 'lx-branch--c' : ''}`}
                style={{ strokeWidth: s.w, opacity: s.o, animationDelay: `${s.delay + ti * 0.12}s` } as CSSProperties}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
