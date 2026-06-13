import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Kanban, Search, Sparkles, Zap } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Glass } from '@/shared/ui/glass/index.js';
import iconStarlex from '@/assets/icon-starlex.png';
import { TEAM } from './avatarData.js';
import { Av } from './avatars.js';

type WindowId = 'board' | 'command' | 'realtime';

const WINDOWS: {
  id: WindowId;
  label: string;
  eyebrow: string;
  title: string;
  Icon: typeof Kanban;
}[] = [
  { id: 'board', label: 'Board', eyebrow: 'Live board', title: 'Drag work across every status', Icon: Kanban },
  { id: 'command', label: 'Command', eyebrow: 'Command mode', title: 'Jump, create, assign in one hit', Icon: Zap },
  { id: 'realtime', label: 'Realtime', eyebrow: 'Team sync', title: 'Every teammate sees the same move', Icon: Bell },
];

const MINI_CARDS = [
  { id: 'SLX-112', text: 'Presence avatars', color: '#e0726f' },
  { id: 'SLX-104', text: 'Rate-limit invites', color: '#d9a06b' },
  { id: 'SLX-91', text: 'Command palette', color: '#79c9a4' },
];

function BoardWindow() {
  return (
    <div className="lx-mw-window-body lx-mw-board">
      {['Todo', 'Progress', 'Done'].map((col, index) => (
        <div key={col} className="lx-mw-col">
          <div className="lx-mw-col-head">
            <span />
            {col}
          </div>
          {MINI_CARDS.slice(index, index + 1).map((card) => (
            <motion.div
              key={card.id}
              className="lx-mw-card"
              layoutId={`mobile-${card.id}`}
              style={{ '--mw-card-color': card.color } as CSSProperties}
            >
              <strong>{card.text}</strong>
              <span>{card.id}</span>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

function CommandWindow() {
  return (
    <div className="lx-mw-window-body lx-mw-command">
      <div className="lx-mw-command-input">
        <Search />
        <span>invite</span>
        <i />
      </div>
      {['Invite member to workspace', 'Open workspace members', 'Create onboarding task'].map((item, index) => (
        <div key={item} className={`lx-mw-command-row ${index === 0 ? 'lx-mw-command-row--active' : ''}`}>
          {index === 0 ? <Sparkles /> : <CheckCircle2 />}
          <span>{item}</span>
          {index === 0 && <kbd>enter</kbd>}
        </div>
      ))}
    </div>
  );
}

function RealtimeWindow() {
  return (
    <div className="lx-mw-window-body lx-mw-realtime">
      <div className="lx-mw-pulse-line">
        <span className="lx-mw-live"><i />Live</span>
        <span className="lx-rt-avatars" aria-hidden>
          {TEAM.map((who) => <Av key={who} who={who} />)}
        </span>
      </div>
      <div className="lx-mw-sync-card">
        <span className="lx-card-id">SLX-131</span>
        <strong>Ship the new landing page</strong>
        <span className="lx-mw-status"><i />In Review</span>
      </div>
      <div className="lx-mw-feed">
        <Av who="AT" />
        Artur requested review · just now
      </div>
    </div>
  );
}

function renderWindow(id: WindowId) {
  if (id === 'command') return <CommandWindow />;
  if (id === 'realtime') return <RealtimeWindow />;
  return <BoardWindow />;
}

/**
 * Mobile-only interactive product shot. The desktop hero keeps its existing
 * full board frame; this component is hidden outside the mobile breakpoint.
 */
export function MobileWindowDeck() {
  const [active, setActive] = useState<WindowId>('board');
  const deckRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const activeWindow = useMemo(() => WINDOWS.find((item) => item.id === active) ?? WINDOWS[0], [active]);

  const updateTilt = useCallback((clientX: number, clientY: number) => {
    const node = deckRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width - 0.5;
    const py = (clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  }, []);

  return (
    <section className="lx-mobile-showcase" aria-label="Interactive Starlex windows">
      <div
        ref={deckRef}
        className="lx-mobile-deck"
        style={{ '--mw-tilt-x': `${tilt.x}deg`, '--mw-tilt-y': `${tilt.y}deg` } as CSSProperties}
        onPointerMove={(event) => updateTilt(event.clientX, event.clientY)}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div className="lx-mw-orbit" aria-hidden />
        <Glass variant="modal" depth="floating" className="lx-mw-main-window">
          <div className="lx-mw-chrome">
            <img src={iconStarlex} alt="" />
            <span>{activeWindow.eyebrow}</span>
            <strong>{activeWindow.label}</strong>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeWindow.id}
              initial={{ opacity: 0, y: 18, rotateX: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, rotateX: 10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 310, damping: 30 }}
            >
              <div className="lx-mw-title-row">
                <activeWindow.Icon />
                <h2>{activeWindow.title}</h2>
              </div>
              {renderWindow(activeWindow.id)}
            </motion.div>
          </AnimatePresence>
        </Glass>

        {WINDOWS.map((item, index) => (
          <motion.button
            key={item.id}
            type="button"
            className={`lx-mw-tab lx-mw-tab--${index} ${active === item.id ? 'lx-mw-tab--active' : ''}`}
            onClick={() => setActive(item.id)}
            whileTap={{ scale: 0.94 }}
            aria-pressed={active === item.id}
          >
            <item.Icon />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
