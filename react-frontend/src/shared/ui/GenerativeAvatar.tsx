import { memo } from 'react';
import { AVATAR_VIEWBOX, buildAvatarSpec, type AvatarSpec } from '@/shared/lib/generativeAvatar.js';

interface GenerativeAvatarProps {
  /** Stable seed — workspace id (or name before an id exists). */
  seed: string;
  /** Accent hue 0–359; when omitted, derived from the seed. */
  hue?: number;
  /** Geometry salt — "regenerate" bumps this, the colour stays put. */
  variant?: number;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Pre-built spec (when the caller already memoised it). */
  spec?: AvatarSpec;
}

function ShapeNode({ shape }: { shape: AvatarSpec['shapes'][number] }) {
  const common = { fill: shape.fill, fillOpacity: shape.opacity };
  switch (shape.kind) {
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
    case 'ring':
      return (
        <circle
          cx={shape.cx}
          cy={shape.cy}
          r={shape.r}
          fill="none"
          stroke={shape.fill}
          strokeOpacity={shape.opacity}
          strokeWidth={Math.max(3, (shape.r ?? 16) * 0.34)}
        />
      );
    case 'triangle':
      return <path d={shape.d} {...common} />;
    case 'rect':
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.w}
          height={shape.h}
          rx={shape.rx}
          transform={shape.rotate ? `rotate(${shape.rotate} ${(shape.x ?? 0) + (shape.w ?? 0) / 2} ${(shape.y ?? 0) + (shape.h ?? 0) / 2})` : undefined}
          {...common}
        />
      );
    default:
      return null;
  }
}

/**
 * Deterministic geometric avatar. Pure SVG, no canvas/network; the heavy work
 * (the composition) is computed once and memoised in `buildAvatarSpec`, so
 * re-renders are essentially free.
 */
export const GenerativeAvatar = memo(function GenerativeAvatar({
  seed,
  hue,
  variant = 0,
  size = 32,
  className = '',
  style = {},
  spec: providedSpec,
}: GenerativeAvatarProps) {
  const spec = providedSpec ?? buildAvatarSpec(seed, hue, variant);
  const clipId = `ga-clip-${spec.id}`;
  const gradId = `ga-grad-${spec.id}`;
  const radius = AVATAR_VIEWBOX * 0.28;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}`}
      role="img"
      aria-label="Workspace avatar"
      className={className}
      style={{ borderRadius: size * 0.28, flexShrink: 0, display: 'block', ...style }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={spec.bgFrom} />
          <stop offset="1" stopColor={spec.bgTo} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width={AVATAR_VIEWBOX} height={AVATAR_VIEWBOX} rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={AVATAR_VIEWBOX} height={AVATAR_VIEWBOX} fill={`url(#${gradId})`} />
        {spec.shapes.map((shape, i) => (
          <ShapeNode key={`s${i}`} shape={shape} />
        ))}
        {spec.lines.map((line, i) => (
          <line
            key={`l${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.stroke}
            strokeOpacity={line.opacity}
            strokeWidth={line.width}
            strokeLinecap="round"
          />
        ))}
        {/* top rim sheen — keeps it from looking flat on dark surfaces */}
        <rect
          width={AVATAR_VIEWBOX}
          height={AVATAR_VIEWBOX}
          rx={radius}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={0.16}
          strokeWidth={1}
        />
      </g>
    </svg>
  );
});

export default GenerativeAvatar;
