import { useEffect, useRef } from 'react';

/* Angular traces — straight runs with 45° elbows, drawn once, fixed.
   Two layers: a faint monochrome base, and a crimson twin revealed only
   inside a cursor-following mask (plus a global tint while scrolling). */
const PATHS = [
  'M -40 170 H 430 L 590 330 H 1660',
  'M 240 -40 V 230 L 470 460 V 950',
  'M 1660 90 H 1210 L 1050 250 H 560 L 410 400 H -40',
  'M 1340 -40 V 180 L 1180 340 V 620 L 1340 780 V 950',
  'M -40 640 H 240 L 420 820 H 760',
  'M 860 950 V 720 L 1020 560 H 1660',
  'M 620 -40 V 80 L 760 220 H 980',
];

/**
 * Full-viewport etched lines. Pointer position is written as CSS vars from
 * one rAF-throttled listener; everything that "reacts" is a pre-painted
 * layer whose mask/stroke transitions — no per-frame JS animation.
 */
export function LanderLines() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--lx-mx', `${e.clientX}px`);
        el.style.setProperty('--lx-my', `${e.clientY}px`);
      });
    };

    let cool = 0;
    const onScroll = () => {
      el.classList.add('lx-lines--hot');
      window.clearTimeout(cool);
      cool = window.setTimeout(() => el.classList.remove('lx-lines--hot'), 500);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(cool);
    };
  }, []);

  return (
    <svg
      ref={ref}
      className="lx-lines"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g className="lx-lines-base">
        {PATHS.map((d) => <path key={d} d={d} />)}
      </g>
      <g className="lx-lines-glow">
        {PATHS.map((d) => <path key={`halo-${d}`} d={d} className="lx-lines-halo" />)}
        {PATHS.map((d) => <path key={`core-${d}`} d={d} />)}
      </g>
    </svg>
  );
}
