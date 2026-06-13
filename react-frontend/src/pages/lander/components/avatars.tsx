import { memo } from 'react';
import { AVATARS } from './avatarData.js';

/** Circular photo avatar; falls back to initials for any unmapped key. */
export const Av = memo(function Av({ who, className = '' }: { who: string; className?: string }) {
  const a = AVATARS[who];
  return (
    <span className={`lx-avatar ${className}`.trim()}>
      {a ? <img src={a.src} alt="" loading="lazy" /> : who}
    </span>
  );
});
