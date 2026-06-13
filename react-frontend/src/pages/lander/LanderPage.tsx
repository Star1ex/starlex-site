import { useEffect } from 'react';
import { Seo } from '@/shared/seo/Seo.js';
import { LanderLines } from './components/LanderLines.js';
import { LanderNav } from './components/LanderNav.js';
import { LanderHero } from './components/LanderHero.js';
import { LanderChapters } from './components/LanderChapters.js';
import { LanderPrinciples } from './components/LanderPrinciples.js';
import { LanderFinale } from './components/LanderFinale.js';
import './lander.css';

/**
 * Standalone marketing page at /lander. Always ultra-dark: lander.css pins
 * the --sx-* contract locally on .lx-root, so the glass material renders
 * identically whatever theme the app is in.
 */
export function LanderPage() {
  useEffect(() => {
    const prev = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = '#050407';
    return () => { document.documentElement.style.backgroundColor = prev; };
  }, []);

  return (
    <div className="lx-root">
      <Seo
        title="Starlex — Task Tracker for Small Teams"
        titleIsFull
        path="/"
        description="Starlex is a fast, keyboard-first task tracker for small teams. Projects, subtasks, and realtime boards in one calm workspace. Start free."
      />

      <div className="lx-ambient" aria-hidden />
      <LanderLines />
      <LanderNav />

      <main className="lx-main">
        <LanderHero />
        <LanderChapters />
        <LanderPrinciples />
        <LanderFinale />
      </main>
    </div>
  );
}

export default LanderPage;
