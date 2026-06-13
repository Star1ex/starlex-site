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
 * Floating glass header. Over the hero it sits wide and bare; once the page
 * scrolls it contracts into a tight glass dock (CSS transitions the padding/
 * gap, framer springs the lift). A shared-layout pill chases whichever link
 * the cursor is on.
 */
export function LanderNav() {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

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
        animate={scrolled ? { y: 0, scale: 1 } : { y: 8, scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.7 }}
      >
        <a
          className="lx-nav-brand"
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <img src={iconStarlex} alt="" />
          Starlex
        </a>
        <div className="lx-nav-links" onMouseLeave={() => setHovered(null)}>
          {links.map((l) => (
            <button
              key={l.target}
              type="button"
              className="lx-nav-link"
              onMouseEnter={() => setHovered(l.target)}
              onClick={() => scrollToSection(l.target)}
            >
              {hovered === l.target && (
                <motion.span className="lx-nav-pill" layoutId="lx-nav-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className="lx-nav-link-label">{l.label}</span>
            </button>
          ))}
        </div>
        <Link to="/sign-in" className="lx-nav-link lx-nav-link--login">Log in</Link>
        <Link to="/sign-up" className="lx-btn lx-btn--primary lx-nav-cta">Get started</Link>
      </Glass>
    </div>
  );
}
