import { startTransition, useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Circle, Kanban } from 'lucide-react';
import { Glass } from '@/shared/ui/glass/index.js';

const SUBTASKS = [
  'Hero section with product frame',
  'Command palette interaction',
  'Footer and pricing copy',
];

const RING_R = 6.2;
const RING_C = 2 * Math.PI * RING_R;

function ProgressRing({ done, total }: { done: number; total: number }) {
  return (
    <span className="lx-tree-progress">
      <svg className="lx-ring" viewBox="0 0 16 16" aria-hidden>
        <circle className="lx-ring-track" cx="8" cy="8" r={RING_R} />
        <motion.circle
          className="lx-ring-fill"
          cx="8"
          cy="8"
          r={RING_R}
          strokeDasharray={RING_C}
          animate={{ strokeDashoffset: RING_C * (1 - done / total) }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
      </svg>
      {done}/{total}
    </span>
  );
}

/**
 * Workspace → project → task → subtask vignette. Subtasks unfold with a
 * stagger, then check themselves off while the parent's ring fills.
 */
export function StructureDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;
    let cancelled = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => { if (!cancelled && !document.hidden) fn(); }, ms));
    };
    const defer = (fn: () => void) => startTransition(fn);
    const cycle = () => {
      if (document.hidden) return;
      at(400, () => defer(() => setOpen(true)));
      [1, 2, 3].forEach((n) => at(1300 + n * 1100, () => defer(() => setDone(n))));
      at(6400, () => defer(() => {
        setOpen(false);
        setDone(0);
      }));
    };
    cycle();
    const loop = window.setInterval(cycle, 7600);
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      startTransition(() => {
        setOpen(false);
        setDone(0);
      });
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(loop);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [inView, reduceMotion]);

  return (
    <Glass ref={ref} variant="menu" depth="floating" className="lx-tree" role="img" aria-label="Project structure demo">
      <div className="lx-tree-row lx-tree-row--project">
        <Kanban style={{ color: '#7d9bd1' }} />
        Mobile launch
        <span className="lx-tree-progress">Project</span>
      </div>

      <div className="lx-tree-row lx-tree-row--task">
        <motion.span
          style={{ display: 'inline-flex' }}
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        >
          <ChevronRight />
        </motion.span>
        Landing page redesign
        <ProgressRing done={done} total={SUBTASKS.length} />
      </div>

      <div className={`lx-tree-subtasks ${open ? 'lx-tree-subtasks--open' : ''}`}>
        <div className="lx-tree-subtasks-inner">
          {SUBTASKS.map((title, i) => {
            const checked = done > i;
            return (
              <motion.div
                key={title}
                className={`lx-tree-row lx-tree-row--sub ${checked ? 'lx-tree-row--done' : ''}`}
                initial={false}
                animate={{ opacity: open ? 1 : 0, x: open ? 0 : -10 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30, delay: open ? 0.08 * i : 0 }}
              >
                {checked
                  ? <CheckCircle2 style={{ color: '#79c9a4' }} />
                  : <Circle style={{ opacity: 0.45 }} />}
                {title}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Glass>
  );
}
