import { Reveal } from './Reveal.js';

const audiences = [
  {
    idx: '01',
    tag: 'Startups',
    title: 'Move before you’ve set up process',
    body: 'Spin up a workspace, invite the team by email, and you’re triaging tasks in minutes. No required fields, no workflow builder, no onboarding call.',
  },
  {
    idx: '02',
    tag: 'Product teams',
    title: 'Hold the line on what matters',
    body: 'Saved views, a personal My Issues queue, and boards that stay honest about priority across every project — without the weekly status meeting.',
  },
  {
    idx: '03',
    tag: 'Side projects',
    title: 'Heavy when you need it, never heavyweight',
    body: 'Subtasks, labels, and markdown specs are there the moment the work demands them, and out of your way the rest of the time.',
  },
];

const principles = [
  { num: '01', title: 'Keyboard-first', body: 'Every action has a shortcut and the command palette reaches all of them. The mouse is a convenience, never a requirement.' },
  { num: '02', title: 'Calm by design', body: 'Nothing on screen is begging for attention. Every surface earns its place, or it gets cut.' },
  { num: '03', title: 'Latency is a bug', body: 'Interactions are tuned to land instantly. Waiting on your own tools is a defect, not a cost of doing business.' },
  { num: '04', title: 'Teams stay visible', body: 'Everyone can see what’s moving and what’s stuck — without asking around or sitting through a standup.' },
];

/** Audience spec-sheet + the product manifesto — deliberately not a card grid. */
export function LanderPrinciples() {
  return (
    <>
      <div className="lx-divider lx-container" aria-hidden />

      <section className="lx-section lx-container" id="teams">
        <Reveal className="lx-grid-head">
          <span className="lx-mark"><span className="lx-mark-id">SLX-04</span>Who it&apos;s for</span>
          <h2 className="lx-h2">Small teams, not enterprises.</h2>
          <p className="lx-body">
            Starlex is deliberately small-team software: fast to adopt, honest
            about scope, and free of enterprise ceremony.
          </p>
        </Reveal>
        <div className="lx-usecases">
          {audiences.map((a, i) => (
            <Reveal key={a.tag} delay={i * 0.08} className="lx-usecase">
              <span className="lx-usecase-rule" aria-hidden />
              <div className="lx-usecase-head">
                <span className="lx-usecase-idx">{a.idx}</span>
                <span className="lx-usecase-tag">{a.tag}</span>
              </div>
              <h3>{a.title}</h3>
              <p>{a.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="lx-section lx-container" id="principles">
        <Reveal className="lx-grid-head">
          <span className="lx-mark"><span className="lx-mark-id">SLX-05</span>Principles</span>
          <h2 className="lx-h2">Four rules we don&apos;t break.</h2>
        </Reveal>
        <div className="lx-manifesto">
          {principles.map((p, i) => (
            <Reveal key={p.num} delay={i * 0.06} className="lx-manifesto-row">
              <span className="lx-manifesto-num">{p.num}</span>
              <h3 className="lx-manifesto-title">{p.title}</h3>
              <p className="lx-manifesto-body">{p.body}</p>
              <span className="lx-manifesto-rail" aria-hidden />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
