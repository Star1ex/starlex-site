import type { Variants, Transition } from 'framer-motion';

/* =====================================================
   MOTION — the single framer source (Phase 5).
   Mirrors styles/motion.css. Two springs + a duration
   scale; every variant below is built from them. Do not
   inline ad-hoc spring configs or durations in components.
   ===================================================== */

// Durations (seconds) — mirror --motion-fast/base/slow.
export const durations = {
  fast: 0.12,
  base: 0.18,
  slow: 0.28,
} as const;

// Signature springs — mirror --spring-ui / --spring-soft.
export const springUI: Transition = { type: 'spring', stiffness: 420, damping: 34 };
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 30 };

// Back-compat preset map (older call-sites import `springs.*`).
// Collapsed onto the two-spring system; `bouncy` kept for the drag lift.
export const springs = {
  gentle: springSoft,
  snappy: springUI,
  bouncy: { type: 'spring' as const, stiffness: 500, damping: 25, mass: 0.5 },
  slow: springSoft,
} as const;

// Page transition variants (content-only crossfade; transform kept tiny).
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: springUI },
  exit: { opacity: 0, transition: { duration: durations.fast, ease: 'easeIn' } },
};

// Route content crossfade — opacity only, the shell never moves.
export const routeFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.14, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: 'easeIn' } },
};

// Modal variants
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.base } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springUI },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: durations.fast, ease: 'easeIn' } },
};

// Dropdown variants
export const dropdownVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springUI },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: { duration: durations.fast, ease: 'easeIn' } },
};

// List stagger variants — 12ms/row, capped at 10 rows (≤120ms total).
const STAGGER_STEP = 0.012;
const STAGGER_CAP = 10;
export const listVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.02 } },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: springSoft },
};

/** Capped stagger delay (seconds) for index-driven list entrances. */
export const staggerDelay = (index: number): number =>
  Math.min(index, STAGGER_CAP) * STAGGER_STEP;

// Slide-in from left (sidebar items, auth form fields)
export const slideInVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: springSoft },
};

// Interactive gesture presets (buttons whileTap; cards whileHover).
export const tapScale = { scale: 0.97 } as const;
export const hoverScale = { scale: 1.01 } as const;
export const cardHover = { y: -2 } as const;

// Drag overlay variants
export const dragOverlayVariants: Variants = {
  initial: { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  animate: {
    scale: 1.03,
    rotate: 1.5,
    boxShadow: '0 20px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.1)',
    transition: springs.bouncy,
  },
};
