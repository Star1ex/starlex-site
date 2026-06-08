import React from 'react';

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  const palette = ['#6366f1','#8b5cf6','#0ea5e9','#10b981','#f59e0b','#f43f5e','#ec4899','#14b8a6'];
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

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
  const bg = color || hashColor(name);
  const text = initials(name || '?');
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

export function getWorkspaceColor(name: string): string {
  return hashColor(name);
}
