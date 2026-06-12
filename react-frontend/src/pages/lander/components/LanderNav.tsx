import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Glass } from '@/shared/ui/glass/index.js';
import iconStarlex from '@/assets/icon-starlex.png';

const links = [
  { label: 'Product', target: 'product' },
  { label: 'Speed', target: 'speed' },
  { label: 'Realtime', target: 'realtime' },
  { label: 'Principles', target: 'principles' },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Floating glass header. Starts as bare text over the hero; once the page
 * scrolls, the glass material fades in underneath (Raycast-style pill dock).
 */
export function LanderNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lx-nav-wrap">
      <Glass
        as={motion.nav}
        variant="dock"
        className={`lx-nav ${scrolled ? '' : 'lx-nav--top'}`}
        aria-label="Landing"
        initial={false}
        animate={scrolled ? { y: 0, scale: 1 } : { y: 10, scale: 1.045 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      >
        <a
          className="lx-nav-brand"
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <img src={iconStarlex} alt="" />
          Starlex
        </a>
        <div className="lx-nav-links">
          {links.map((l) => (
            <button key={l.target} type="button" className="lx-nav-link" onClick={() => scrollToSection(l.target)}>
              {l.label}
            </button>
          ))}
        </div>
        <Link to="/sign-in" className="lx-nav-link">Log in</Link>
        <Link to="/sign-up" className="lx-btn lx-btn--primary lx-nav-cta">Get started</Link>
      </Glass>
    </div>
  );
}
