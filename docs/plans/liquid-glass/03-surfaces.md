# Phase 3 — Content surfaces: tables, lists, cards, chips

> Prereq: Phases 1–2 (token contract + `<Glass>` material live).
> Skills: `/shadcn` (primitives), `everything-claude-code:liquid-glass-design` (container/merge principles), `vercel:react-best-practices`.
> Output: every content surface (Projects, Tasks explorer, My Issues, Members, Home) speaks the material language. This is the highest-volume phase — mostly CSS-class migration, low risk per item.

## Surface doctrine (applies to every screen below)

- **Container = glass, content = solid.** A page gets at most ONE `<Glass variant="panel">` shell (e.g. the table shell). Rows, cells, chips inside it are solid token surfaces (`--sx-surface*`) — no per-row blur, no per-row borders.
- **Row separation** = alternating nothing + hover `--sx-surface-hover`; a single `--sx-line` under the header row only. Delete all `border-bottom` per-row hairlines.
- **Hierarchy** = type + spacing: `label-caps` column headers, 13px cells, titles `--sx-text`, metadata `--sx-text-subtle`. No font-weight ladders above 600.
- **Chips/pills** (status, priority, labels): `<Glass variant="pill">` (solid), tinted by the Phase-1 custom status palette: bg `color-mix(<text> 14%, transparent)`, **no border** except a faint `color-mix(<text> 22%, transparent)` ring on hover/open. Dot indicator 6px round, same hue.
- Empty states: centered, icon in a `--sx-surface` rounded-xl square, one sentence `--sx-text-subtle`, one ghost action. No dashed borders.

## Tasks per screen (file-level)

### 3.1 Projects (`pages/workspace/WorkspaceProjects.tsx`, `projects/*`, `components.css .projects-*`)
- Table shell → `<Glass variant="panel" depth="raised">`; header row `label-caps` + single `--sx-line`.
- Rows: transparent → hover `--sx-surface-hover`, radius-sm inside padding; remove `.projects-list-row` borders.
- Health/priority/status cells use the chip doctrine; progress bar: 3px track `--sx-line`, fill **accent only when ≥100%? No —** fill `--sx-text-subtle`→`--sx-text-muted` gradient; accent reserved (Design Law 6).
- Project glyph: flat rounded square with workspace color at 85% saturation cap (prevents neon).

### 3.2 Tasks explorer (`pages/tasks/TaskExplorerPage.tsx` + `explorer/*`, `.tasks-*` in components.css)
- Filter rail: `<Glass variant="panel">` only if it floats; if docked, solid `--sx-canvas-elevated` with NO border — separation by luminance.
- Toolbar buttons / view toggle: ghost buttons (transparent → surface-hover), active = `--sx-surface-active`, no borders.
- Table: same doctrine as 3.1. Inline triggers (status/label/assignee/date) = chip doctrine; their popovers = `<Glass variant="menu">` (already from Phase 2 recipes).
- Board view (`features/taskBoard/*`): columns = transparent lanes with `label-caps` headers; cards = `<Glass variant="card" interactive depth="rest">` — cards are the ONE place per-item glass is allowed (they are few and large); drag overlay gets `depth="floating"` + slight rotation (1.5deg) — premium drag feel.

### 3.3 My Issues (`pages/tasks/MyIssuesPage.tsx`)
- Tab strip: text-only tabs, active = `--sx-text` + 2px accent underline (scalpel accent), inactive `--sx-text-subtle`. No pill backgrounds.
- List rows: same row doctrine; status dot + key in mono.

### 3.4 Members (`features/members/*`)
- Member cards → one `<Glass variant="panel">` list, rows solid; role select = chip; Owner badge: `label-caps` text in status-done hue — **no yellow crown pill**.
- Invite-link block: nested *solid* `--sx-canvas-elevated` section inside the panel (no double glass).

### 3.5 Home / workspace welcome (`pages/workspace/WorkspaceBento.tsx`, `WorkspaceWelcome.tsx`, `.workspace-*`)
- Recent/bento cards → `<Glass variant="card" interactive>`; greeting header: plain text on canvas, big Geist −0.02em tracking, NO panel behind it.
- "New project" ghost button: dashed nothing — text + plus icon, surface-hover behavior.

### 3.6 Auth & onboarding pages (`pages/auth/*`, `OnboardingPage`)
- One centered `<Glass variant="modal" depth="floating">` card over the depth field. Inputs: `.glass-input` recipe but radius-md (not 9999px — rounded-full inputs read as template), labels `label-caps`.

### 3.7 components.css shrink + alias removal
- For each screen migrated, delete its dead blocks from `components.css` (target: 2,906 → <1,500 lines this phase) and remove now-unused `@deprecated` aliases from `tokens.css` (Phase 1.6 list). `grep -rn "var(--bg-\|var(--button-bg\|var(--glass-bg" src` after each screen — drive to zero.
- TSX cleanup as you touch files: remove leftover `!text-[#fca5a5]`-style literals (e.g. GlobalSidebar logout) → semantic `--sx-danger` token (add to contract: `#e0726f` dark / `#c2473f` light + its light value).

## Definition of Done
- [ ] All five screen groups on the material doctrine; no per-row borders anywhere
- [ ] `grep -c "border" src/styles/components.css` reduced ≥60% vs phase start (record numbers in PROGRESS.md)
- [ ] Status/priority chips identical across Projects/Tasks/MyIssues/Board (one source)
- [ ] Both themes verified per screen (screenshot pairs into `docs/plans/liquid-glass/shots/` if running with a browser tool)
- [ ] `npm run lint && npm run build` green

Commit: `feat(frontend): [glass 3/5] all content surfaces on Glass material doctrine`
Append handoff to `PROGRESS.md`.
