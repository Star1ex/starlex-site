import { startTransition, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { Glass } from '@/shared/ui/glass/index.js';
import { AVATARS, TEAM } from './avatarData.js';
import { Av } from './avatars.js';

interface Beat {
  status: string;
  color: string;
  who: string;
  event: string;
}

const BEATS: Beat[] = [
  { status: 'Todo', color: '#7d9bd1', who: 'AR', event: 'Artem created the task' },
  { status: 'In Progress', color: '#d4c06b', who: 'ZK', event: 'Zakhar started working' },
  { status: 'In Review', color: '#d9a06b', who: 'AT', event: 'Artur requested review' },
  { status: 'Done', color: '#79c9a4', who: 'AR', event: 'Artem closed the task' },
];

/**
 * Realtime sync vignette: one task card whose status flips as teammates
 * "edit" it — the same broadcast every connected client receives.
 */
export function RealtimeDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      startTransition(() => setBeat((b) => (b + 1) % BEATS.length));
    }, 2400);
    return () => window.clearInterval(timer);
  }, [inView, reduceMotion]);

  const current = BEATS[beat];

  return (
    <Glass ref={ref} variant="menu" depth="floating" className="lx-rt" role="img" aria-label="Realtime sync demo">
      <div className="lx-rt-head">
        <span className="lx-rt-live"><i />Live</span>
        <div className="lx-rt-avatars" aria-hidden>
          {TEAM.map((who) => <Av key={who} who={who} />)}
        </div>
      </div>

      <div className="lx-rt-task">
        <div className="lx-rt-task-row">
          <span className="lx-card-id">SLX-131</span>
          <span className="lx-rt-task-title">Ship the new landing page</span>
        </div>
        <div className="lx-rt-task-row">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current.status}
              className="lx-status-chip"
              style={{ color: current.color }}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              <i />{current.status}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current.who}
              className="lx-avatar"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              {AVATARS[current.who]
                ? <img src={AVATARS[current.who].src} alt="" />
                : current.who}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="lx-rt-event">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.event}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Av who={current.who} />
            {current.event} · just now
          </motion.span>
        </AnimatePresence>
      </div>
    </Glass>
  );
}
