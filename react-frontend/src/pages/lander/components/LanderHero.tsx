import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { Glass } from '@/shared/ui/glass/index.js';
import { BoardDemo } from './BoardDemo.js';
import { EASE } from './Reveal.js';

const lineReveal = {
  hidden: { y: '110%' },
  visible: (i: number) => ({
    y: '0%',
    transition: { duration: 0.9, delay: 0.15 + i * 0.09, ease: EASE },
  }),
};

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
});

/**
 * Hero: masked-line headline reveal, then a glass product frame that
 * settles out of a 3D tilt as the page scrolls (Linear/Raycast cadence).
 */
export function LanderHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const boardInView = useInView(stageRef, { amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'start 0.35'],
  });
  const settle = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.6 });
  const rotateX = useTransform(settle, [0, 1], [14, 0]);
  const scale = useTransform(settle, [0, 1], [0.94, 1]);
  const frameOpacity = useTransform(settle, [0, 0.4], [0.55, 1]);

  return (
    <header className="lx-hero lx-container" id="top">
      <motion.span className="lx-kicker" {...fadeIn(0.05)}>
        Task tracking for small teams
      </motion.span>

      <h1 className="lx-display" aria-label="Every task. One pane of glass.">
        <span className="lx-mask-line" aria-hidden>
          <motion.span style={{ display: 'block' }} custom={0} variants={lineReveal} initial="hidden" animate="visible">
            Every task.
          </motion.span>
        </span>
        <span className="lx-mask-line" aria-hidden>
          <motion.span style={{ display: 'block' }} custom={1} variants={lineReveal} initial="hidden" animate="visible">
            One <span className="lx-dim">pane of glass.</span>
          </motion.span>
        </span>
      </h1>

      <motion.p className="lx-lede" {...fadeIn(0.45)}>
        Starlex keeps projects, tasks, and people in one fast, keyboard-driven
        workspace — synced live for everyone on your team.
      </motion.p>

      <motion.div className="lx-hero-actions" {...fadeIn(0.58)}>
        <Link to="/sign-up" className="lx-btn lx-btn--primary lx-btn--lg">Start for free</Link>
        <a
          href="https://github.com/critiq17/team-track"
          target="_blank"
          rel="noreferrer"
          className="lx-btn lx-btn--ghost lx-btn--lg"
        >
          View source
        </a>
      </motion.div>

      <motion.span className="lx-hero-meta" {...fadeIn(0.7)}>
        Open source · no credit card · built by a team of three
      </motion.span>

      <div className="lx-hero-stage" ref={stageRef} id="product">
        <Glass
          as={motion.div}
          variant="modal"
          depth="floating"
          className="lx-frame"
          style={{ rotateX, scale, opacity: frameOpacity, transformOrigin: 'center 20%' }}
        >
          <div className="lx-frame-bar" aria-hidden>
            <span className="lx-frame-dot" />
            <span className="lx-frame-dot" />
            <span className="lx-frame-dot" />
            <span className="lx-frame-title">starlex — all tasks</span>
          </div>
          <BoardDemo active={boardInView} />
        </Glass>
      </div>
    </header>
  );
}
