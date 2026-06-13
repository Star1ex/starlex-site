import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays, CheckCircle2, Home, Inbox, Kanban, LayoutList, Plus, Search, Settings, Users,
} from 'lucide-react';
import { Av } from './avatars.js';

type ColumnId = 'backlog' | 'todo' | 'progress' | 'review' | 'done';

interface DemoCard {
  id: string;
  title: string;
  prio: { text: string; color: string } | null;
  due?: { text: string; urgent?: boolean };
  who: string;
}

const COLUMNS: { id: ColumnId; name: string; color: string }[] = [
  { id: 'backlog', name: 'Backlog', color: '#9b97a3' },
  { id: 'todo', name: 'To Do', color: '#7d9bd1' },
  { id: 'progress', name: 'In Progress', color: '#d4c06b' },
  { id: 'review', name: 'In Review', color: '#d9a06b' },
  { id: 'done', name: 'Done', color: '#79c9a4' },
];

const PRIO = {
  urgent: { text: 'Urgent', color: '#e0726f' },
  high: { text: 'High', color: '#d9a06b' },
  medium: { text: 'Medium', color: '#cdb964' },
  low: { text: 'Low', color: '#7d9bd1' },
} as const;

const CARDS: Record<string, DemoCard> = {
  'SLX-87':  { id: 'SLX-87',  title: 'Offline mode research', prio: PRIO.low, who: 'ZK' },
  'SLX-93':  { id: 'SLX-93',  title: 'Workspace audit log', prio: null, who: 'AT' },
  'SLX-104': { id: 'SLX-104', title: 'Rate-limit invites', prio: PRIO.high, due: { text: 'Jun 17' }, who: 'ZK' },
  'SLX-108': { id: 'SLX-108', title: 'Project empty states', prio: PRIO.medium, who: 'AR' },
  'SLX-112': { id: 'SLX-112', title: 'Presence avatars', prio: PRIO.urgent, due: { text: 'Due today', urgent: true }, who: 'AR' },
  'SLX-115': { id: 'SLX-115', title: 'Board drag & drop', prio: PRIO.high, who: 'AT' },
  'SLX-99':  { id: 'SLX-99',  title: 'Danger zone settings', prio: PRIO.medium, who: 'ZK' },
  'SLX-91':  { id: 'SLX-91',  title: '⌘K command palette', prio: PRIO.high, who: 'AR' },
  'SLX-84':  { id: 'SLX-84',  title: 'Markdown editor', prio: PRIO.medium, who: 'AT' },
};

const INITIAL: Record<ColumnId, string[]> = {
  backlog: ['SLX-87', 'SLX-93'],
  todo: ['SLX-104', 'SLX-108'],
  progress: ['SLX-112', 'SLX-115'],
  review: ['SLX-99'],
  done: ['SLX-91', 'SLX-84'],
};

/** Scripted moves replayed on loop: [card, from, to]. Net effect is zero. */
const SCRIPT: [string, ColumnId, ColumnId][] = [
  ['SLX-112', 'progress', 'review'],
  ['SLX-104', 'todo', 'progress'],
  ['SLX-99', 'review', 'done'],
  ['SLX-87', 'backlog', 'todo'],
  ['SLX-112', 'review', 'done'],
  ['SLX-115', 'progress', 'review'],
  ['SLX-112', 'done', 'progress'],
  ['SLX-99', 'done', 'review'],
  ['SLX-104', 'progress', 'todo'],
  ['SLX-87', 'todo', 'backlog'],
  ['SLX-115', 'review', 'progress'],
];

const SIDEBAR = [
  { icon: Home, label: 'Home' },
  { icon: Kanban, label: 'Projects' },
  { icon: LayoutList, label: 'Tasks', active: true },
  { icon: Users, label: 'Members' },
  { icon: CheckCircle2, label: 'My Issues' },
  { icon: Inbox, label: 'Inbox' },
];

/**
 * Self-playing replica of the real Tasks board: sidebar, ⌘K search pill,
 * five status columns. Cards migrate with spring layout animation — the
 * moves live in a ref so React StrictMode can't double-apply them.
 */
export function BoardDemo({ active }: { active: boolean }) {
  const [cols, setCols] = useState(INITIAL);
  const [lastMoved, setLastMoved] = useState<string | null>(null);
  const stepRef = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      const [card, from, to] = SCRIPT[stepRef.current % SCRIPT.length];
      stepRef.current += 1;
      setLastMoved(card);
      setCols((prev) => {
        if (!prev[from].includes(card) || prev[to].includes(card)) return prev;
        return {
          ...prev,
          [from]: prev[from].filter((id) => id !== card),
          [to]: [card, ...prev[to]],
        };
      });
    }, 2400);
    return () => window.clearInterval(timer);
  }, [active, reduceMotion]);

  return (
    <div className="lx-board">
      <div className="lx-board-side" aria-hidden>
        <div className="lx-board-ws">
          <span className="lx-board-ws-avatar" />
          Starlex HQ
          <span className="lx-board-ws-chevron">▾</span>
        </div>
        {SIDEBAR.map(({ icon: Icon, label, active: isActive }) => (
          <div key={label} className={`lx-board-nav-item ${isActive ? 'lx-board-nav-item--active' : ''}`}>
            <Icon /> {label}
          </div>
        ))}
        <div className="lx-board-side-foot">
          <div className="lx-board-nav-item"><Settings /> Settings</div>
          <div className="lx-board-user">
            <Av who="AC" />
            <span className="lx-board-user-meta">
              <strong>Artem Chaika</strong>
              <span>artem@starlex.cc</span>
            </span>
          </div>
        </div>
      </div>

      <div className="lx-board-main">
        <div className="lx-board-search-row" aria-hidden>
          <div className="lx-board-search">
            <Search />
            Search or jump to…
            <span className="lx-kbd">⌘K</span>
          </div>
        </div>

        <div className="lx-board-toolbar" aria-hidden>
          <div>
            <div className="lx-board-page-title">All Tasks</div>
            <div className="lx-board-page-sub">{Object.keys(CARDS).length} tasks</div>
          </div>
          <div className="lx-board-newtask"><Plus /> New task</div>
        </div>

        <LayoutGroup>
          <div className="lx-board-cols">
            {COLUMNS.map((col) => (
              <div key={col.id} className="lx-board-col">
                <div className="lx-board-col-head">
                  <span className="lx-status-dot" style={{ background: col.color }} />
                  {col.name}
                  <span className="lx-count">{cols[col.id].length}</span>
                </div>
                <div className="lx-board-col-list">
                  {cols[col.id].map((id) => {
                    const card = CARDS[id];
                    return (
                      <motion.div
                        key={id}
                        layout
                        layoutId={id}
                        className={`lx-card ${lastMoved === id ? 'lx-card--moved' : ''}`}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                      >
                        <div className="lx-card-top">
                          <div className="lx-card-title">{card.title}</div>
                          {card.prio && (
                            <span className="lx-prio-chip" style={{ color: card.prio.color }}>
                              <i />{card.prio.text}
                            </span>
                          )}
                        </div>
                        <div className="lx-card-meta">
                          <span className="lx-card-id">{card.id}</span>
                          {card.due && (
                            <span className={`lx-card-due ${card.due.urgent ? 'lx-card-due--urgent' : ''}`}>
                              <CalendarDays />
                              {card.due.text}
                            </span>
                          )}
                          <Av who={card.who} />
                        </div>
                      </motion.div>
                    );
                  })}
                  <AnimatePresence>
                    {cols[col.id].length === 0 && (
                      <motion.div
                        className="lx-board-drop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.3 } }}
                        exit={{ opacity: 0 }}
                      >
                        Drop here
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
