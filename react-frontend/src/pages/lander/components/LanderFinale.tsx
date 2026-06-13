import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import iconStarlex from '@/assets/icon-starlex.png';
import { Reveal } from './Reveal.js';

const WORD = 'Starlex';
const SUPPORT = 'support@starlex.cc';

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Closing act: the wordmark settles in on scroll, then its letters lean away
 * from the cursor and brighten on approach — a quiet bit of physics that makes
 * the bottom of the page worth reaching. Below it, a structured glass footer.
 */
export function LanderFinale() {
  const ref = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0.2, 1]);

  // Per-letter cursor repulsion — imperative so it never re-renders React.
  useEffect(() => {
    const wrap = wordRef.current;
    if (!wrap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const letters = Array.from(wrap.querySelectorAll<HTMLElement>('.lx-finale-letter'));
    const RADIUS = 240;
    let raf = 0;

    const reset = () => {
      for (const el of letters) {
        el.style.transform = 'translate(0px, 0px)';
        el.style.setProperty('--lx-l-glow', '0');
      }
    };
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        for (const el of letters) {
          const r = el.getBoundingClientRect();
          const dx = r.left + r.width / 2 - e.clientX;
          const dy = r.top + r.height / 2 - e.clientY;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS) {
            const f = 1 - dist / RADIUS;
            const push = f * f * 34;
            const ang = Math.atan2(dy, dx);
            el.style.transform = `translate(${Math.cos(ang) * push}px, ${Math.sin(ang) * push}px)`;
            el.style.setProperty('--lx-l-glow', f.toFixed(3));
          } else {
            el.style.transform = 'translate(0px, 0px)';
            el.style.setProperty('--lx-l-glow', '0');
          }
        }
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', reset);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <section className="lx-finale lx-container" ref={ref}>
        <motion.h2 className="lx-finale-word" ref={wordRef} style={{ scale, y, opacity }} aria-label={WORD}>
          {WORD.split('').map((ch, i) => (
            <span className="lx-finale-letter" key={`${ch}-${i}`} aria-hidden>{ch}</span>
          ))}
        </motion.h2>
        <Reveal delay={0.1}>
          <p className="lx-lede" style={{ textAlign: 'center' }}>
            Create a workspace, invite your team, and feel the difference inside
            the first five minutes.
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
        <div className="lx-footer-grid">
          <div className="lx-footer-brandcol">
            <span className="lx-footer-brand">
              <img src={iconStarlex} alt="" />
              Starlex
            </span>
            <p>
              Task tracking for small teams — boards, projects, and realtime
              sync, with the mouse strictly optional.
            </p>
            <a className="lx-footer-mail" href={`mailto:${SUPPORT}`}>{SUPPORT}</a>
          </div>

          <nav className="lx-footer-col" aria-label="Product">
            <h4>Product</h4>
            <button type="button" onClick={() => scrollToSection('speed')}>Speed</button>
            <button type="button" onClick={() => scrollToSection('realtime')}>Realtime</button>
            <button type="button" onClick={() => scrollToSection('structure')}>Structure</button>
            <button type="button" onClick={() => scrollToSection('principles')}>Principles</button>
          </nav>

          <nav className="lx-footer-col" aria-label="Company">
            <h4>Company</h4>
            <Link to="/about-us">About</Link>
            <a href={`mailto:${SUPPORT}`}>Contact</a>
            <button type="button" onClick={() => scrollToSection('teams')}>Who it&apos;s for</button>
          </nav>

          <nav className="lx-footer-col" aria-label="Get started">
            <h4>Get started</h4>
            <Link to="/sign-up">Create workspace</Link>
            <Link to="/sign-in">Log in</Link>
          </nav>
        </div>

        <div className="lx-footer-base">
          <span>© {new Date().getFullYear()} Starlex</span>
          <span className="lx-footer-note">Built on one pane of glass.</span>
          <span className="lx-footer-spacer" />
          <button type="button" className="lx-footer-top" onClick={scrollToTop}>
            Back to top <ArrowUp />
          </button>
        </div>
      </footer>
    </>
  );
}
