import { Glass } from '@/shared/ui/glass/index.js';
import { Reveal } from './Reveal.js';

const principles = [
  { num: '01', title: 'Open by default', body: 'The source is public on GitHub. No hidden roadmap, no lock-in — read the code that runs your work.' },
  { num: '02', title: 'Calm tools', body: 'No clutter, no notification noise. Every surface earns its place, or it gets cut.' },
  { num: '03', title: 'Speed first', body: 'Interactions are tuned to feel instant. Latency is treated as a bug, not a cost of doing business.' },
  { num: '04', title: 'Visible teams', body: 'Everyone sees what is moving and what is stuck — without status meetings or asking around.' },
];

const audiences = [
  { num: 'For startups', title: 'Ship the roadmap, not the process', body: 'Spin up a workspace, invite the team by email, and start moving tasks in minutes. Nothing to configure before the work starts.' },
  { num: 'For product teams', title: 'See the whole sprint at a glance', body: 'Boards, saved views, and a personal My Issues queue keep priorities honest across projects.' },
  { num: 'For side projects', title: 'Heavy enough, never heavyweight', body: 'Subtasks, labels, and markdown specs when you need them — a clean black canvas when you don’t.' },
];

/** Audience cards + the four product principles. */
export function LanderPrinciples() {
  return (
    <>
      <div className="lx-divider lx-container" aria-hidden />

      <section className="lx-section lx-container" id="teams">
        <Reveal className="lx-grid-head">
          <span className="lx-kicker">Who it&apos;s for</span>
          <h2 className="lx-h2">Built for teams that ship.</h2>
          <p className="lx-body">
            Starlex is deliberately small-team software: fast to adopt, honest
            about scope, and free of enterprise ceremony.
          </p>
        </Reveal>
        <div className="lx-cards">
          {audiences.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.08}>
              <Glass variant="card" interactive className="lx-pcard">
                <span className="lx-pcard-num">{a.num}</span>
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </Glass>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lx-section lx-container" id="principles">
        <Reveal className="lx-grid-head">
          <span className="lx-kicker">Principles</span>
          <h2 className="lx-h2">Four rules we don&apos;t break.</h2>
        </Reveal>
        <div className="lx-cards lx-cards--four">
          {principles.map((p, i) => (
            <Reveal key={p.num} delay={i * 0.08}>
              <Glass variant="card" interactive className="lx-pcard">
                <span className="lx-pcard-num">{p.num}</span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </Glass>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
