import React from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '@/shared/lib/animations.js';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a page in a motion.div with the standard fade-up spring entrance.
 * Use this around the top-level element of every page component.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => (
  <motion.div
    className={className}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {children}
  </motion.div>
);
