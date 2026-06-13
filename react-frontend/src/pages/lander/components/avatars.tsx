import avAR from '@/assets/lander/av-ar.png';
import avZK from '@/assets/lander/av-zk.png';
import avAT from '@/assets/lander/av-at.png';

/** Real faces instead of abstract initials — the demo "team". */
export const AVATARS: Record<string, { src: string; name: string }> = {
  AR: { src: avAR, name: 'Artem' },
  ZK: { src: avZK, name: 'Zakhar' },
  AT: { src: avAT, name: 'Artur' },
  AC: { src: avAR, name: 'Artem Chaika' },
};

export const TEAM = ['AR', 'ZK', 'AT'];

/** Circular photo avatar; falls back to initials for any unmapped key. */
export function Av({ who, className = '' }: { who: string; className?: string }) {
  const a = AVATARS[who];
  return (
    <span className={`lx-avatar ${className}`.trim()}>
      {a ? <img src={a.src} alt="" loading="lazy" /> : who}
    </span>
  );
}
