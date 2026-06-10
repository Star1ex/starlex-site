import React from 'react';
import { hashWorkspaceColor, workspaceInitials } from './workspaceIconUtils.js';

interface WorkspaceGlyphProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const WorkspaceGlyph: React.FC<WorkspaceGlyphProps> = ({
  name,
  color,
  size = 32,
  className = '',
  style = {},
}) => {
  const bg = color || hashWorkspaceColor(name);
  const text = workspaceInitials(name || '?');
  const fontSize = size * 0.38;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: size * 0.28, flexShrink: 0, ...style }}
      aria-label={`${name} workspace`}
    >
      <rect width="32" height="32" fill={bg} rx={size * 0.28} />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={fontSize}
        fontFamily="Hanken Grotesk, Inter, system-ui, sans-serif"
        fontWeight="700"
        letterSpacing="-0.5"
      >
        {text}
      </text>
    </svg>
  );
};
