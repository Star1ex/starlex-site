import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion';
import { Glass } from '@/shared/ui/glass/index.js';
import iconStarlex from '@/assets/icon-starlex.png';
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
        The open-source tracker for small teams: boards that move when your
        teammates do, and a command palette that makes the mouse optional.
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

      <div className="lx-hero-stage" ref={stageRef} id="product">
        <Glass
          as={motion.div}
          variant="modal"
          depth="floating"
          className="lx-frame"
          style={{ rotateX, scale, opacity: frameOpacity, transformOrigin: 'center 20%' }}
        >
          <div className="lx-frame-bar" aria-hidden>
            <img src={iconStarlex} className="lx-frame-glyph" alt="" />
            <span className="lx-frame-crumbs">
              Starlex HQ <i>›</i> Tasks <i>›</i> <strong>Board</strong>
            </span>
            <span className="lx-frame-bar-right">
              <span className="lx-rt-avatars">
                <span className="lx-avatar">AR</span>
                <span className="lx-avatar">ZK</span>
                <span className="lx-avatar">AT</span>
              </span>
              <span className="lx-frame-sync"><i />Synced</span>
              <span className="lx-kbd">⌘K</span>
            </span>
          </div>
          <BoardDemo active={boardInView} />
        </Glass>
      </div>
    </header>
  );
}
