import type { ReactNode } from 'react';
import { CommandDemo } from './CommandDemo.js';
import { RealtimeDemo } from './RealtimeDemo.js';
import { StructureDemo } from './StructureDemo.js';
import { Reveal } from './Reveal.js';

interface ChapterProps {
  id: string;
  mark: string;
  kicker: string;
  title: ReactNode;
  body: string;
  points: string[];
  demo: ReactNode;
  flip?: boolean;
}

function Chapter({ id, mark, kicker, title, body, points, demo, flip }: ChapterProps) {
  return (
    <section className={`lx-section lx-container lx-chapter ${flip ? 'lx-chapter--flip' : ''}`} id={id}>
      <Reveal className="lx-chapter-copy">
        <span className="lx-mark"><span className="lx-mark-id">{mark}</span>{kicker}</span>
        <h2 className="lx-h2">{title}</h2>
        <p className="lx-body">{body}</p>
        <ul className="lx-chapter-points">
          {points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </Reveal>
      <Reveal delay={0.12}>{demo}</Reveal>
    </section>
  );
}

/** The three feature chapters — each demo is live DOM that plays in view. */
export function LanderChapters() {
  return (
    <>
      <Chapter
        id="speed"
        mark="SLX-01"
        kicker="Speed"
        title={<>Your keyboard is <span className="lx-dim">the interface.</span></>}
        body="Press ⌘K anywhere and the command palette takes over — create tasks, jump between projects, reassign work, switch themes. Latency is treated as a bug, so every interaction lands instantly."
        points={[
          'Command palette reaches every action in the app',
          'Create, assign, and close tasks without touching the mouse',
          'Instant navigation across workspaces and projects',
        ]}
        demo={<CommandDemo />}
      />

      <Chapter
        id="realtime"
        mark="SLX-02"
        kicker="Realtime"
        title={<>One source of truth, <span className="lx-dim">always live.</span></>}
        body="Every change is broadcast over a persistent connection the moment it happens. When a teammate moves a task, your board moves too — no refresh button, no stale state, no asking around."
        points={[
          'Boards, tasks, and projects sync across every open client',
          'Presence shows who is in the workspace right now',
          'Updates arrive as they happen, not on reload',
        ]}
        demo={<RealtimeDemo />}
        flip
      />

      <Chapter
        id="structure"
        mark="SLX-03"
        kicker="Structure"
        title={<>Structure that <span className="lx-dim">scales down.</span></>}
        body="Workspaces hold projects, projects hold tasks, tasks hold subtasks — and that's the whole model. Statuses, priorities, and labels stay out of the way until you need to filter by them."
        points={[
          'Subtask progress rolls up to the parent task',
          'Six statuses, five priorities, your own labels',
          'Rich markdown descriptions on every task',
        ]}
        demo={<StructureDemo />}
      />
    </>
  );
}
