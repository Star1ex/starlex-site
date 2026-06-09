# Session 3 — Polish & QA: motion, keyboard, responsive, cleanup, verification

> Read `00-OVERVIEW.md` first. Sessions 1–2 made it work and look right; this session makes it feel
> *fast and finished*, removes the last legacy/dead code, and **proves** the core flows work.
> **Skills:** `liquid-glass-design` (motion recipes), `vercel:react-best-practices` (render/effect
> perf), `e2e-testing` / `/e2e` (Playwright journeys), `frontend-patterns`, `coding-standards`.
> End green: `npm run type-check && npm run build`.

---

## Goal
Linear-fast micro-interactions, full keyboard support, a working command palette, responsive sanity,
accessibility, zero dead/duplicate code, and a verified pass over the critical user journeys.

## Tasks

### 1. Motion & micro-interactions  *(`liquid-glass-design`, framer-motion already a dep)*
- Nav items `active:scale-90`; cards/icons hover lift; list-arrow `group-hover:translate-x-1`;
  action glyphs `group-hover:scale-110`. Durations 120–300ms.
- Route transitions via the existing `PageTransition`/`AnimatePresence` — subtle, no layout jank.
- Board dnd: spring on the drag overlay, smooth column reflow, gentle drop settle.
- Toasts, dialogs, dropdowns, sheet: enter/leave transitions consistent across the app.
- **Respect `prefers-reduced-motion`** everywhere (gate springs/transforms behind it).

### 2. Command palette + keyboard  *(`/shadcn` `command`)*
- Topbar ⌘K opens a glass `command` palette: navigate (workspaces, projects, settings, profile),
  **create task**, **create project**, switch saved view, jump to a task by key.
- Global shortcuts: `c` new task, `/` focus search, `⌘K` palette, arrow-nav + `enter` in lists,
  `esc` closes overlays. Don't fire shortcuts while typing in inputs/editor.
- Visible focus rings (accent) on all interactive elements; logical tab order; dnd keyboard sensor works.

### 3. State completeness sweep
- Every list/page/panel has explicit **loading** (glass skeleton), **empty** (glass card + icon +
  muted copy + a primary action where relevant), and **error** (message + retry) states.
- Optimistic mutations always have a revert + toast path. No silent failures, no infinite spinners.

### 4. Realtime coherence  *(`shared/lib/realtime.ts`, `useRealtime`)*
- Two tabs on the same workspace stay in sync: task create/move/status, project update, member
  add/remove/role-change, presence avatars. Dedupe vs local optimistic by `actor_id` + entity id + ts.
- Reconnect with backoff after a network blip; resubscribe on workspace switch; close on unmount/logout.

### 5. Logout & session hygiene
- `AuthContext.logout`: **await** `authService.logout()` (204, server-side revoke) before clearing
  local state; close the realtime connection + clear active-workspace context; then `navigate('/sign-in')`.
  Error path still clears local + redirects.

### 6. Responsive & mobile sanity
- Sidebar collapses to a drawer (shadcn `sheet`) under `lg`; topbar search becomes an icon.
- Task explorer filter rail → collapsible drawer on mobile; board scrolls horizontally; list reflows.
- Modals/dialogs/settings usable on small screens. No horizontal overflow on any page.

### 7. Dead-code & duplication cleanup  *(`refactor-cleaner` mindset)*
- Confirm gone: folder code, `components/MarkdownEditor.tsx` stub, legacy `components/Tasks/TaskView.tsx`,
  any superseded `shared/ui` atom, any duplicate Profile/markdown component.
- Grep `src/components/` — migrate or delete remaining legacy leaves into FSD (`widgets`/`features`/`shared`).
- Run `npx tsc --noEmit`, then a dead-export scan (e.g. `knip` / `ts-prune`) and remove orphans.
- Enforce ≤300-line components; split any stragglers (`MembersPanel`, settings panels) if still over.

### 8. Verification  *(`/e2e`, `e2e-testing`)*
Manually run the app, then add Playwright journeys for the critical flows:
- Register → verify → onboarding (name + color + icon) → land in workspace dashboard.
- Create project → create task → set status via menu → drag across board → reload, state persisted.
- Members: add by email → change role → generate invite link → accept in another session.
- Task explorer: apply filters + saved view, URL reflects state, back button works.
- Logout returns to `/sign-in` and the session is revoked.
- Capture screenshots/video as artifacts; quarantine any flaky test rather than leave it red.

### 9. Final consistency + a11y audit
- One read-through of every route for token/spacing/typography consistency against `00-OVERVIEW.md` §5.
- Color-contrast on glass text passes; all icon-only buttons have `aria-label`; dialogs trap focus.

## Acceptance (Session 3 / program done when…)
- [ ] Micro-interactions everywhere, 120–300ms, `prefers-reduced-motion` respected.
- [ ] ⌘K command palette + global shortcuts + full keyboard nav + visible focus rings.
- [ ] Loading/empty/error covered on every surface; no silent failures.
- [ ] Realtime keeps two tabs in sync; reconnect works; logout reliably revokes + redirects.
- [ ] Responsive from mobile to wide; no overflow; sidebar/filters collapse cleanly.
- [ ] No dead/duplicate/legacy code; `src/components` legacy emptied into FSD; all components ≤300 lines.
- [ ] Playwright journeys for the core flows pass; artifacts captured.
- [ ] `npm run type-check && npm run build` green. Program Definition of Done (`00-OVERVIEW.md`) met.

## Suggested commits
`feat(frontend): micro-interactions + motion polish` ·
`feat(frontend): command palette + keyboard navigation` ·
`feat(frontend): complete loading/empty/error states` ·
`fix(frontend): reliable logout + realtime teardown` ·
`feat(frontend): responsive sidebar/filters/board` ·
`refactor(frontend): remove legacy components + dead exports` ·
`test(frontend): e2e journeys for core flows`
