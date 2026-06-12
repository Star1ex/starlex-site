import { PROJECT_ICONS, parseProjectIcon } from '@/shared/lib/projectIcon.js';

interface ProjectIconProps {
  icon?: string | null;
  /** Used only for the empty-state initial. */
  name?: string;
  size?: number;
  /** Show the tinted chip background behind lucide icons. */
  chip?: boolean;
  className?: string;
  strokeWidth?: number;
}

/**
 * Renders a project's icon: tinted Lucide glyph, emoji, or name-initial.
 * `chip` wraps it in the soft tinted square used in lists and headers.
 */
export function ProjectIcon({
  icon,
  name = '',
  size = 18,
  chip = false,
  className = '',
  strokeWidth = 2,
}: ProjectIconProps) {
  const token = parseProjectIcon(icon);

  if (token.kind === 'lucide' && token.name) {
    const Glyph = PROJECT_ICONS[token.name];
    const inner = <Glyph size={size} strokeWidth={strokeWidth} color={token.color} />;
    if (!chip) return inner;
    return (
      <span
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          width: size * 1.7,
          height: size * 1.7,
          borderRadius: size * 0.5,
          color: token.color,
          background: `color-mix(in srgb, ${token.color} 15%, transparent)`,
        }}
      >
        {inner}
      </span>
    );
  }

  if (token.kind === 'emoji' && token.emoji) {
    return <span className={className} style={{ fontSize: size, lineHeight: 1 }}>{token.emoji}</span>;
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'P';
  return (
    <span className={className} style={{ fontSize: size * 0.8, fontWeight: 700, lineHeight: 1 }}>
      {initial}
    </span>
  );
}

export default ProjectIcon;
