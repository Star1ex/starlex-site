import type { Variants } from 'framer-motion';

// Spring configs
export const springs = {
  gentle: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.6 },
  bouncy: { type: 'spring' as const, stiffness: 500, damping: 25, mass: 0.5 },
  slow: { type: 'spring' as const, stiffness: 200, damping: 35, mass: 1 },
} as const;

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.18, ease: 'easeIn' } },
};

// Modal variants
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 },
  },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15, ease: 'easeIn' } },
};

// Dropdown variants
export const dropdownVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: -6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 },
  },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: { duration: 0.12, ease: 'easeIn' } },
};

// List stagger variants
export const listVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  },
};

// Slide-in from left (sidebar items, auth form fields)
export const slideInVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  },
};

// Scale on tap/hover (interactive elements)
export const tapScale = { scale: 0.98 } as const;
export const hoverScale = { scale: 1.01 } as const;

// Drag overlay variants
export const dragOverlayVariants: Variants = {
  initial: { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  animate: {
    scale: 1.03,
    rotate: 0.5,
    boxShadow: '0 20px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.1)',
    transition: { type: 'spring', stiffness: 400, damping: 28, mass: 0.6 },
  },
};
