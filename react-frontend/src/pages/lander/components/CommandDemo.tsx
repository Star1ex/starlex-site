import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Layers, Mail, Palette, Plus, Search, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Glass } from '@/shared/ui/glass/index.js';

interface Cmd {
  icon: LucideIcon;
  text: string;
  kbd?: string;
}

const ALL: Cmd[] = [
  { icon: Plus, text: 'Create new task', kbd: 'C' },
  { icon: Mail, text: 'Invite member to workspace' },
  { icon: CheckCircle2, text: 'Mark task as Done' },
  { icon: Layers, text: 'Go to project — Platform' },
  { icon: Users, text: 'Open workspace members' },
  { icon: Palette, text: 'Switch theme' },
];

const QUERY = 'invite';
/** phase: idle → typing → selected → reset */
const TICK_MS = 130;

/** Self-typing ⌘K palette: rows filter live as the query types itself. */
export function CommandDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [chars, setChars] = useState(0);
  const [selected, setSelected] = useState(false);
  const [keysDown, setKeysDown] = useState(false);

  useEffect(() => {
    if (!inView || reduceMotion) return undefined;
    let cancelled = false;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(() => { if (!cancelled) fn(); }, ms));
    };

    const runCycle = (offset: number) => {
      at(offset, () => { setKeysDown(true); });
      at(offset + 350, () => { setKeysDown(false); });
      for (let i = 1; i <= QUERY.length; i++) {
        at(offset + 700 + i * TICK_MS, () => setChars(i));
      }
      at(offset + 700 + QUERY.length * TICK_MS + 700, () => setSelected(true));
      at(offset + 700 + QUERY.length * TICK_MS + 2100, () => {
        setSelected(false);
        setChars(0);
      });
    };

    runCycle(400);
    const loop = window.setInterval(() => runCycle(0), 6400);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(loop);
    };
  }, [inView, reduceMotion]);

  const query = QUERY.slice(0, chars);
  const rows = query
    ? ALL.filter((c) => c.text.toLowerCase().includes(query))
    : ALL.slice(0, 4);

  return (
    <div ref={ref}>
      <Glass variant="menu" depth="floating" className="lx-cmdk" role="img" aria-label="Command palette demo">
        <div className="lx-cmdk-input">
          <Search />
          <span className="lx-cmdk-query">
            {query.length > 0 ? query : <span className="lx-cmdk-placeholder">Type a command or search…</span>}
            <span className="lx-cmdk-caret" />
          </span>
          <span className="lx-kbd" style={{ marginLeft: 'auto' }}>esc</span>
        </div>
        <div className="lx-cmdk-list">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((cmd, i) => {
              const Icon = cmd.icon;
              const active = i === 0 && (query.length > 0 || selected);
              return (
                <motion.div
                  key={cmd.text}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: active && selected ? 0.985 : 1,
                  }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className={`lx-cmdk-row ${active ? 'lx-cmdk-row--active' : ''}`}
                >
                  <Icon />
                  {cmd.text}
                  {cmd.kbd && <span className="lx-kbd">{cmd.kbd}</span>}
                  {active && !cmd.kbd && <span className="lx-kbd">↵</span>}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Glass>

      <div className="lx-keys" aria-hidden>
        <span className={`lx-keycap ${keysDown ? 'lx-keycap--down' : ''}`}>⌘</span>
        <span className={`lx-keycap ${keysDown ? 'lx-keycap--down' : ''}`}>K</span>
      </div>
    </div>
  );
}
