import { useLayoutEffect, useState } from 'react';
import {
  ChevronDown, CircleCheckBig, House, Inbox, ListTodo,
  LogOut, Plus, Settings2, SquareKanban, UserRound, UsersRound,
  Copy, Edit3, Trash2, Star, Search,
} from 'lucide-react';
import { Glass } from '@/shared/ui/glass/index.js';
import { RefractionFilter } from '@/shared/ui/glass/RefractionFilter.js';
import { GenerativeAvatar } from '@/shared/ui/GenerativeAvatar.js';
import { ProjectIcon } from '@/shared/ui/ProjectIcon.js';
import { buildLucideIcon, PROJECT_ICON_COLORS } from '@/shared/lib/projectIcon.js';
import { hexToHue } from '@/shared/lib/generativeAvatar.js';
import { IconColorPicker } from '@/shared/ui/IconColorPicker.js';

function IconPickerDemo() {
  const [icon, setIcon] = useState(buildLucideIcon('Rocket', PROJECT_ICON_COLORS[3].value));
  return (
    <div data-icp-demo style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <IconColorPicker value={icon} onChange={setIcon} triggerClassName="project-icon-trigger" />
      <span style={{ fontSize: '0.78rem', color: 'var(--sx-text-subtle)' }}>click to open the Liquid-Glass picker</span>
    </div>
  );
}

/* ─── Theme detection ─── */
function applyTheme() {
  const params = new URLSearchParams(window.location.search);
  const t = params.get('theme');
  document.documentElement.setAttribute(
    'data-theme',
    t === 'light' ? 'light' : 'ultra-dark',
  );
}

const STATUS = [
  { label: 'Backlog',     color: 'var(--status-backlog-text)' },
  { label: 'Todo',        color: 'var(--status-todo-text)' },
  { label: 'In Progress', color: 'var(--status-progress-text)' },
  { label: 'In Review',   color: 'var(--status-review-text)' },
  { label: 'Done',        color: 'var(--status-done-text)' },
  { label: 'Canceled',    color: 'var(--status-canceled-text)' },
] as const;

const PRIORITY = [
  { label: 'Urgent', color: 'var(--priority-urgent-text)' },
  { label: 'High',   color: 'var(--priority-high-text)' },
  { label: 'Medium', color: 'var(--priority-medium-text)' },
  { label: 'Low',    color: 'var(--priority-low-text)' },
  { label: 'None',   color: 'var(--priority-none-text)' },
] as const;

const ROWS = [
  { title: 'Audit sign-up funnel analytics',  status: 'var(--status-done-text)',     priority: 'var(--priority-high-text)',   key: 'SX-001' },
  { title: 'Wire OAuth 2.0 callback',         status: 'var(--status-progress-text)', priority: 'var(--priority-high-text)',   key: 'SX-002' },
  { title: 'Glass input components',          status: 'var(--status-review-text)',   priority: 'var(--priority-medium-text)', key: 'SX-003' },
  { title: 'Accessibility pass — WCAG AA',    status: 'var(--status-todo-text)',     priority: 'var(--priority-low-text)',    key: 'SX-004' },
  { title: 'Write visual QA harness',         status: 'var(--status-todo-text)',     priority: 'var(--priority-urgent-text)', key: 'SX-005' },
  { title: 'Update onboarding copy',          status: 'var(--status-backlog-text)',  priority: 'var(--priority-none-text)',   key: 'SX-006' },
];

/* ─── Busy content (rendered behind glass specimens in right column) ─── */
function BusyContent() {
  return (
    <div style={{ padding: '1rem 1.25rem', userSelect: 'none' }}>
      <p style={{ color: 'var(--sx-text)', fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.375rem' }}>
        Q3 Roadmap — Auth
      </p>
      <p style={{ color: 'var(--sx-text-muted)', fontSize: '0.84rem', lineHeight: 1.55, marginBottom: '0.65rem', maxWidth: '28ch' }}>
        Redesign sign-up flow to cut drop-off by 40%. Social OAuth parity, reduced friction, glass inputs.
      </p>
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
        {STATUS.slice(1, 4).map(s => (
          <span key={s.label} className="sx-chip" style={{ color: s.color }}>
            <span className="sx-dot" /><span>{s.label}</span>
          </span>
        ))}
        {PRIORITY.slice(0, 2).map(p => (
          <span key={p.label} className="sx-chip" style={{ color: p.color }}>
            <span className="sx-dot" /><span>{p.label}</span>
          </span>
        ))}
      </div>
      {ROWS.slice(0, 4).map(r => (
        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.4rem', fontSize: '0.84rem', color: 'var(--sx-text-muted)', borderRadius: '6px' }}>
          <span style={{ color: r.status, fontSize: '0.6rem' }}>●</span>
          <span style={{ color: 'var(--sx-text-subtle)', fontSize: '0.68rem', fontFamily: 'monospace' }}>{r.key}</span>
          <span>{r.title}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Tier A mocks ─── */
function SidebarMock() {
  const NAV = [
    { label: 'Home',      Icon: House,         active: false },
    { label: 'Projects',  Icon: SquareKanban,  active: true  },
    { label: 'Tasks',     Icon: ListTodo,      active: false },
    { label: 'Members',   Icon: UsersRound,    active: false },
    { label: 'My Issues', Icon: CircleCheckBig,active: false },
    { label: 'Inbox',     Icon: Inbox,         active: false },
  ];
  return (
    <div style={{ width: 240, display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1.1rem 0.75rem 1rem' }}>
      <button className="sidebar-workspace-button" type="button">
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--sx-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>S</div>
        <span className="sidebar-workspace-name">Starlex</span>
        <ChevronDown size={13} strokeWidth={1.55} className="sidebar-workspace-chevron" />
      </button>
      <nav className="sidebar-nav" style={{ flex: 1, marginTop: '0.25rem' }}>
        {NAV.map(({ label, Icon, active }) => (
          <div key={label} className={`sidebar-nav-item${active ? ' active' : ''}`}>
            <span className="sidebar-nav-icon"><Icon size={15} strokeWidth={1.55} /></span>
            <span className="sidebar-nav-label">{label}</span>
          </div>
        ))}
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem' }}>
        <button className="sidebar-dock-pill" type="button">
          <Settings2 size={14} strokeWidth={1.55} /><span>Settings</span>
        </button>
        <button className="sidebar-dock-pill" type="button">
          <UserRound size={14} strokeWidth={1.55} /><span>critiq17</span>
          <Plus size={12} strokeWidth={1.55} style={{ marginLeft: 'auto', color: 'var(--sx-text-subtle)' }} />
        </button>
      </div>
    </div>
  );
}

function MenuMock() {
  return (
    <div className="dropdown-menu" style={{ width: 200, animation: 'none' }}>
      {[
        { Icon: Star,   label: 'Favourite',  danger: false },
        { Icon: Edit3,  label: 'Rename…',    danger: false },
        { Icon: Copy,   label: 'Duplicate',  danger: false },
        { Icon: LogOut, label: 'Leave',      danger: false },
      ].map(({ Icon, label }) => (
        <button key={label} type="button" className="dropdown-menu-item">
          <Icon size={14} strokeWidth={1.55} />{label}
        </button>
      ))}
      <div className="dropdown-divider" />
      <button type="button" className="dropdown-menu-item dropdown-menu-item--danger">
        <Trash2 size={14} strokeWidth={1.55} />Delete project
      </button>
    </div>
  );
}

function ModalMock() {
  return (
    <Glass variant="modal" depth="floating" style={{ width: 480, padding: '1.5rem' } as React.CSSProperties}>
      <h2 style={{ color: 'var(--sx-text)', fontWeight: 620, fontSize: '1rem', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
        Create project
      </h2>
      <p style={{ color: 'var(--sx-text-muted)', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
        Projects group related tasks and give your team a shared space to plan and ship work together.
      </p>
      <input className="glass-input" placeholder="Project name…" style={{ marginBottom: '1rem' }} readOnly />
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        <button type="button" className="liquid-button" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Cancel</button>
        <button type="button" className="liquid-button" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'var(--sx-accent)', color: '#fff', borderColor: 'transparent' }}>Create</button>
      </div>
    </Glass>
  );
}

function DockMock() {
  return (
    <Glass variant="dock" style={{ display: 'flex', gap: '0.35rem', padding: '0.5rem 0.75rem' } as React.CSSProperties}>
      {[House, SquareKanban, ListTodo, Search, Settings2].map((Icon, i) => (
        <button key={i} type="button" className="sidebar-dock-pill" style={{ minHeight: 36, padding: '0.4rem', borderRadius: 10, background: i === 2 ? 'var(--sx-surface-active)' : undefined }}>
          <Icon size={16} strokeWidth={1.55} />
        </button>
      ))}
    </Glass>
  );
}

/* ─── Specimen frame helpers ─── */
function FieldCell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, padding: '1.5rem' }}>
      {children}
      <span className="label-caps" style={{ position: 'absolute', bottom: 8, right: 12 }}>{label} / field</span>
    </div>
  );
}

function ContentCell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, padding: '1.5rem', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}><BusyContent /></div>
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
      <span className="label-caps" style={{ position: 'absolute', bottom: 8, right: 12, zIndex: 3 }}>{label} / content</span>
    </div>
  );
}

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '0.625rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--sx-text-subtle)',
  borderBottom: '1px solid var(--sx-line)',
  paddingBottom: '0.5rem',
  marginBottom: '1.5rem',
};

const CONTRAST_CELLS = [
  { id: 'canvas', label: 'on canvas', surface: 'canvas' },
  { id: 'field', label: 'on field (bright)', surface: 'field' },
  { id: 'tier-b', label: 'on tier-B surface', surface: 'tier-b' },
  { id: 'glass', label: 'on tier-A glass', surface: 'glass' },
] as const;

function ContrastCell({
  id,
  label,
  surface,
}: {
  id: string;
  label: string;
  surface: 'canvas' | 'field' | 'tier-b' | 'glass';
}) {
  const body = (
    <>
      <p data-fg="true" style={{ color: 'var(--sx-text-muted)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Aa</p>
      <p style={{ color: 'var(--sx-text-muted)', fontSize: '0.84rem', lineHeight: 1.5 }}>Muted text sample</p>
      <p className="label-caps" style={{ marginTop: '0.5rem' }}>{label}</p>
    </>
  );

  const baseStyle: React.CSSProperties = {
    minHeight: 128,
    borderRadius: 12,
    padding: '1.25rem 1rem',
  };

  if (surface === 'glass') {
    return (
      <Glass
        variant="modal"
        depth="floating"
        data-contrast-cell={id}
        style={baseStyle}
      >
        {body}
      </Glass>
    );
  }

  const background =
    surface === 'canvas' ? 'var(--sx-canvas)' :
    surface === 'tier-b' ? 'var(--sx-surface)' :
    'transparent';

  return (
    <div
      data-contrast-cell={id}
      style={{
        ...baseStyle,
        background,
        boxShadow: surface === 'field' ? 'inset 0 0 0 1px var(--sx-line)' : undefined,
      }}
    >
      {body}
    </div>
  );
}

/* ─── Main export ─── */
export function GlassLabPage() {
  useLayoutEffect(() => {
    applyTheme();
  }, []);

  return (
    <div style={{ minHeight: '100vh', color: 'var(--sx-text)' }}>
      {/* Depth field + refraction */}
      <div className="sx-depth" aria-hidden="true" />
      <RefractionFilter />

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* ── S1: Canvas strip ── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={SECTION_LABEL}>canvas</div>
          <div style={{ height: 240, borderRadius: 16, border: '1px dashed var(--sx-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="label-caps">bare depth field — 240 px</span>
          </div>
        </section>

        {/* ── S2: Tier A specimens ── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={SECTION_LABEL}>tier a — chrome glass (sidebar · menu · modal · dock)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>

            {/* Sidebar */}
            <FieldCell label="sidebar">
              <Glass variant="sidebar" refract style={{ display: 'inline-block' } as React.CSSProperties}>
                <SidebarMock />
              </Glass>
            </FieldCell>
            <ContentCell label="sidebar">
              <Glass variant="sidebar" refract style={{ display: 'inline-block' } as React.CSSProperties}>
                <SidebarMock />
              </Glass>
            </ContentCell>

            {/* Menu */}
            <FieldCell label="menu">
              <MenuMock />
            </FieldCell>
            <ContentCell label="menu">
              <MenuMock />
            </ContentCell>

            {/* Modal */}
            <FieldCell label="modal">
              <ModalMock />
            </FieldCell>
            <ContentCell label="modal">
              <ModalMock />
            </ContentCell>

            {/* Dock */}
            <FieldCell label="dock">
              <DockMock />
            </FieldCell>
            <ContentCell label="dock">
              <DockMock />
            </ContentCell>
          </div>
        </section>

        {/* ── S3: Tier B specimens ── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={SECTION_LABEL}>tier b — translucent surfaces (buttons · inputs · chips · rows · cards · scroll)</div>

          {/* Buttons */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>buttons — primary / default / ghost / danger</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {(['primary', 'secondary', 'ghost', 'danger'] as const).map(v => (
                <div key={v} style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" className={`liquid-button${v === 'primary' ? '' : ''}`} data-variant={v}>
                    {v}
                  </button>
                  <button type="button" className="liquid-button" data-variant={v} style={{ opacity: 0.5 }} disabled>
                    disabled
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>inputs — rest · focus</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input className="glass-input" placeholder="Rest state" readOnly />
              <input className="glass-input" placeholder="Focus state" style={{ boxShadow: 'var(--sx-focus-ring)', borderColor: 'transparent' }} readOnly />
            </div>
          </div>

          {/* Chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>status chips</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {STATUS.map(s => (
                <span key={s.label} className="sx-chip" style={{ color: s.color }}>
                  <span className="sx-dot" /><span>{s.label}</span>
                </span>
              ))}
            </div>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>priority chips</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {PRIORITY.map(p => (
                <span key={p.label} className="sx-chip" style={{ color: p.color }}>
                  <span className="sx-dot" /><span>{p.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Table rows */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>table rows (6 rows, row 3 hover-forced)</div>
            <div style={{ borderRadius: 12, overflow: 'hidden' }}>
              {ROWS.map((r, i) => (
                <div
                  key={r.key}
                  className="tasks-table-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem',
                    background: i === 2 ? 'var(--sx-surface-hover)' : undefined,
                    margin: '0 0 1px',
                  }}
                >
                  <span className="tasks-table-key" style={{ width: 56, flexShrink: 0 }}>{r.key}</span>
                  <span style={{ color: r.status, fontSize: '0.65rem', flexShrink: 0 }}>●</span>
                  <span className="tasks-table-title" style={{ flex: 1 }}>{r.title}</span>
                  <span className="sx-chip" style={{ color: r.priority, flexShrink: 0 }}>
                    <span className="sx-dot" /><span>{PRIORITY.find(p => p.color === r.priority)?.label}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Board cards */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>board cards (3)</div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {ROWS.slice(0, 3).map(r => (
                <Glass key={r.key} variant="card" interactive style={{ flex: 1, padding: '1rem' } as React.CSSProperties}>
                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <span className="sx-chip" style={{ color: r.status }}>
                      <span className="sx-dot" /><span>{STATUS.find(s => s.color === r.status)?.label}</span>
                    </span>
                  </div>
                  <p style={{ color: 'var(--sx-text-muted)', fontSize: '0.875rem', lineHeight: 1.45, margin: 0 }}>{r.title}</p>
                  <p style={{ color: 'var(--sx-text-subtle)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{r.key}</p>
                </Glass>
              ))}
            </div>
          </div>

          {/* Scrollable box */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="label-caps" style={{ marginBottom: '0.75rem' }}>scrollable box (200 px) — scrollbar styling</div>
            <div style={{ height: 200, maxWidth: 480, overflowY: 'auto', borderRadius: 12, background: 'var(--sx-surface)', padding: '0.75rem' }}>
              {Array.from({ length: 16 }, (_, i) => (
                <p key={i} style={{ color: 'var(--sx-text-muted)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '0.35rem' }}>
                  Scroll item {i + 1} — checking scrollbar track and thumb styling across themes.
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── S4: Typography ── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={SECTION_LABEL}>typography — on canvas · on glass slab</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* On canvas */}
            <div style={{ padding: '1.5rem' }}>
              <div className="label-caps" style={{ marginBottom: '1rem' }}>on canvas</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--sx-text)', marginBottom: '0.5rem' }}>Heading 1 — Page title</h1>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 620, letterSpacing: '-0.015em', color: 'var(--sx-text)', marginBottom: '0.5rem' }}>Heading 2 — Section title</h2>
              <p style={{ color: 'var(--sx-text)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.35rem' }}>Body text — The quick brown fox jumps over the lazy dog.</p>
              <p style={{ color: 'var(--sx-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.35rem' }}>Muted text — Supporting copy and secondary information.</p>
              <p style={{ color: 'var(--sx-text-subtle)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '0.35rem' }}>Subtle text — Metadata, timestamps, helper hints.</p>
              <span className="label-caps">label caps — metadata keys</span>
            </div>
            {/* On glass slab */}
            <Glass variant="card" style={{ padding: '1.5rem' } as React.CSSProperties}>
              <div className="label-caps" style={{ marginBottom: '1rem' }}>on glass slab</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--sx-text)', marginBottom: '0.5rem' }}>Heading 1 — Page title</h1>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 620, letterSpacing: '-0.015em', color: 'var(--sx-text)', marginBottom: '0.5rem' }}>Heading 2 — Section title</h2>
              <p style={{ color: 'var(--sx-text)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.35rem' }}>Body text — The quick brown fox jumps over the lazy dog.</p>
              <p style={{ color: 'var(--sx-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.35rem' }}>Muted text — Supporting copy and secondary information.</p>
              <p style={{ color: 'var(--sx-text-subtle)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '0.35rem' }}>Subtle text — Metadata, timestamps, helper hints.</p>
              <span className="label-caps">label caps — metadata keys</span>
            </Glass>
          </div>
        </section>

        {/* ── S6: Generative avatars + project icons ── */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={SECTION_LABEL}>generative workspace avatars — deterministic geometry, hue per seed</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {['Acme Engineering', 'Starlex', 'Nimbus Labs', 'Polaris', 'Quantum', 'Vertex', 'Helios Group',
              'Orbit', 'Cobalt', 'Meridian', 'Atlas Works', 'Zenith', 'Lumen', 'Forge', 'Drift', 'Northwind']
              .map((name) => (
                <div key={name} style={{ display: 'grid', justifyItems: 'center', gap: '0.35rem' }}>
                  <GenerativeAvatar seed={name} size={48} />
                  <span style={{ fontSize: '0.62rem', color: 'var(--sx-text-subtle)', maxWidth: 52, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                </div>
              ))}
          </div>

          <div className="label-caps" style={{ marginBottom: '0.6rem' }}>regenerate — same seed + hue, salted geometry (variant 0–7)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {Array.from({ length: 8 }, (_, v) => (
              <GenerativeAvatar key={v} seed="Starlex" hue={hexToHue('#8b5cf6')} variant={v} size={44} />
            ))}
          </div>

          <div className="label-caps" style={{ marginBottom: '0.6rem' }}>accent hue sweep — one seed, palette swatches</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' }}>
            {PROJECT_ICON_COLORS.map((c) => (
              <GenerativeAvatar key={c.value} seed="Meridian" hue={hexToHue(c.value)} size={40} />
            ))}
          </div>

          <div className="label-caps" style={{ marginBottom: '0.6rem' }}>project icons — Lucide glyph tinted per colour · emoji · initial</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
            {['Code2', 'Database', 'Server', 'Rocket', 'Bug', 'GitBranch', 'Cloud', 'Cpu', 'Palette', 'Shield', 'Zap', 'Globe', 'Target', 'Flame']
              .map((nm, i) => (
                <div key={nm} className="project-row-glyph" style={{ width: '1.9rem', height: '1.9rem' }}>
                  <ProjectIcon icon={buildLucideIcon(nm, PROJECT_ICON_COLORS[i % PROJECT_ICON_COLORS.length].value)} size={17} />
                </div>
              ))}
            <div className="project-row-glyph" style={{ width: '1.9rem', height: '1.9rem' }}><ProjectIcon icon="🚀" size={17} /></div>
            <div className="project-row-glyph" style={{ width: '1.9rem', height: '1.9rem' }}><ProjectIcon icon="" name="Default" size={17} /></div>
          </div>

          <div className="label-caps" style={{ margin: '1.5rem 0 0.6rem' }}>icon + colour picker — Liquid-Glass popover</div>
          <IconPickerDemo />
        </section>

        {/* ── S5: Contrast row ── */}
        <section>
          <div style={SECTION_LABEL}>contrast — --sx-text-muted vs each surface (WCAG AA floor = 4.5 : 1)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {CONTRAST_CELLS.map(cell => (
              <ContrastCell key={cell.id} {...cell} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default GlassLabPage;
