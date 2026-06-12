import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import iconStarlex from '@/assets/icon-starlex.png';
import { Reveal } from './Reveal.js';

/** Closing act: the wordmark tightens into place as it scrolls in, then CTA + footer. */
export function LanderFinale() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  // transform/opacity only — animating letter-spacing reflows the type each frame
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0.2, 1]);

  return (
    <>
      <section className="lx-finale lx-container" ref={ref}>
        <Reveal>
          <span className="lx-kicker">Start now</span>
        </Reveal>
        <motion.h2 className="lx-finale-word" style={{ scale, y, opacity }}>
          Starlex
        </motion.h2>
        <Reveal delay={0.1}>
          <p className="lx-lede" style={{ textAlign: 'center' }}>
            Create a workspace, invite your team, and feel the difference in the
            first five minutes.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="lx-hero-actions">
            <Link to="/sign-up" className="lx-btn lx-btn--primary lx-btn--lg">Create your workspace</Link>
            <Link to="/sign-in" className="lx-btn lx-btn--bare lx-btn--lg">Log in</Link>
          </div>
        </Reveal>
      </section>

      <footer className="lx-footer lx-container">
        <div className="lx-footer-inner">
          <span className="lx-footer-brand">
            <img src={iconStarlex} alt="" />
            Starlex
          </span>
          <span>© {new Date().getFullYear()}</span>
          <span className="lx-footer-spacer" />
          <Link to="/about-us">About</Link>
          <a href="https://github.com/critiq17/team-track" target="_blank" rel="noreferrer">GitHub</a>
          <Link to="/sign-up">Get started</Link>
        </div>
      </footer>
    </>
  );
}
