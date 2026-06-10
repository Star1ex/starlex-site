import { SUPPORTS_REFRACTION } from './refraction.js';

/**
 * Mounts the single hidden SVG filter referenced by `<Glass refract>`.
 * Render once near the app root (Layout). Returns null on engines that
 * cannot composite the displacement — those keep the plain blur stack.
 *
 * Keep `scale` subtle (≤16): the difference between Apple-grade refraction
 * and a codepen demo is restraint.
 */
export function RefractionFilter() {
  if (!SUPPORTS_REFRACTION) return null;
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <filter id="sx-refract" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={2} seed={7} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={14} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

export default RefractionFilter;
