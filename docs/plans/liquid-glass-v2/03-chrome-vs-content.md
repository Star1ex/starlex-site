# Phase 3 — Chrome vs Content (the minimalism pass)

> Prereq: Phases 1–2. Read `00-MASTER.md` §2 first.
> Output: glass lives only in chrome; content sits naked on the living canvas; every control translucent. The app, not just the lab, looks right in both themes.

---

## 3.1 Strip content glass (Tier A → Tier C)

Remove the `<Glass variant="panel">` wrappers (replace with a plain element keeping layout classes; content separates by typography + spacing per Law 3):

- `WorkspaceProjects` table shell
- `TaskExplorerContent` table shell
- `MembersPanel` + `MembersPage` list shells
- `WorkspaceBento` recent panel
- `TaskPropertiesPanel` (panel → plain; its controls are already tier B)

Keep the `label-caps` header rows and single hairlines exactly as they are. Rows stay on `--sx-surface-hover` hover (now alpha). After the last call-site: delete the `--panel` variant from `glass.css`, `Glass.tsx`, and the `GlassVariant` type.

Board cards & pills already stopped blurring in Phase 2 (variant demotion) — verify on the board that cards read as translucent tiles with the hover lift intact.

## 3.2 Tier-B sweep (controls)

Most controls already consume `--sx-surface*` and converted automatically in Phase 2. This task is the residue:

- `grep -rn "rgba(255" src/styles/components.css` — re-point the remaining surface/border literals in `.project-*` (detail page + header), `.task-*` (detail blocks), `.profile-*` onto `--sx-surface*` / `--sx-line` / `--sx-text-*`. **Mechanical re-pointing only, no redesign** — this is what makes those screens stop being opaque-dark boxes in light theme.
- `.glass-input`, `.liquid-button`, `.settings-button`, shared `Button`: confirm translucent rendering in both themes; any remaining opaque background → token.
- Sticky/docked surfaces flagged in 2.1 (table headers, filter rail, settings modal chrome): confirm `--sx-opaque`/`--sx-canvas-elevated` where bleed-through showed.

## 3.3 The living canvas (scroll parallax — Law 12)

- One rAF-throttled scroll listener on the app's main scroll container (mount in `Layout.tsx` next to the depth field) writes `--depth-shift: <scrollY * -0.04>px` on the `.sx-depth` element; CSS consumes it as `transform: translateY(var(--depth-shift, 0px))`.
- The field is `position: fixed` and ~110% tall so the shift never exposes an edge.
- Transform-only (Law 7); disabled under `prefers-reduced-motion`; no listener on touch devices if jank appears (test by feel).
- Effect target: scrolling a long task list makes the field — and therefore everything seen *through* the sidebar glass — drift subtly. This is the moment the sidebar starts reading as glass.

## 3.4 Composition nits (bounded — 30 minutes max)

- Home: the Create Task / Create Project buttons float mid-air at the top right (`shots/baseline/dark-home.png`) — move them into the content column's header line, aligned with the `WORKSPACE / Critiqal` block, standard page-header pattern as on Projects/Members.
- Verify the styled scrollbars (Phase 2) on the real scroll containers: tasks table, my-issues, members, settings modal inner column. The `shots/baseline/light-tasks.png` arrow-button scrollbar must be gone everywhere.

## 3.5 Auth pages

No code expected — the login/register `<Glass variant="modal">` inherits the Phase-2 material. Verify with `npm run visual-qa -- --routes /login,/register` in both themes against the before-picture (`shots/baseline/light-login.png`): the card must now read as transparent glass (edge + shadow + diffusion), OAuth buttons as visible translucent tiles. If the card is illegible over the field, tune `--sx-glass-fill-top-strong` (±band from §4.2), not the page.

## 3.6 Gate & DoD

- `npm run lint && npm run build && npm run visual-qa` (lab + auth routes) green incl. contrast floor.
- **Manual walk in the browser, both themes** (the dev server is one command; do not skip): Home, Projects, Project detail, Tasks list + board, Task detail, My Issues, Members, Settings. Hold each screen against its `shots/baseline/` counterpart — the difference must be obvious at arm's length. Judge: glass = sidebar/menus/modals only; live blur per viewport ≤6 by count; content reads Linear-clean; scroll drifts the field; no opaque white/dark boxes anywhere; no native scrollbars.
- Greps: `variant="panel"` → 0; `rgba(255` in `.project-|.task-|.profile-` blocks of `components.css` → 0.
- PROGRESS.md entry incl. what the walk showed; commit: `feat(frontend): [glass-v2 3/4] chrome-only glass, tier-B controls everywhere, living canvas parallax`.
