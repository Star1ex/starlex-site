# Liquid Glass Redesign — Progress Log

Each phase session appends one entry: date, phase, what shipped, deviations from plan, known rough spots for the next session.

---

## 2026-06-10 — Plan created
- Baseline committed on `feature/projects` (`checkpoint(frontend): theme system split, task board refactor, contexts cleanup, frontend review plans`).
- Review findings + 5-phase plan written (`00-MASTER.md` … `05-motion-polish-qa.md`).
- Phase 1 not started.

---

## 2026-06-10 — Phase 1 (Foundation) complete

**What shipped**
- `tokens.css` rewritten as the single semantic contract: `:root` holds ultra-dark values (canvas `#08070a`, surfaces `#100f13/#17161b/#1d1c22`, crimson accent `#e6455a`, glass-material inputs, rim/thickness, neutral shadows, radii `8/10/14/20`, motion easings). Custom desaturated status/priority palette with `-bg` derived via `color-mix(text 14%, transparent)`. All legacy/`--sx-control*`/`--sx-panel*`/`--starlex-accent*`/`--bg-*`/`--glass-*` tokens collapsed into one `@deprecated — remove in Phase 3` alias block that re-points onto the contract.
- `themes/light.css`: the 640-line `!important` override file is gone, replaced by an 80-line `:root[data-theme="light"]` re-valuation of the same token names (canvas `#f4f5f7`, white surfaces, slate text, accent `#d63852`, cool-slate shadows, darkened status hues). Zero `!important`, zero descendant selectors.
- New `depth.css` → `.sx-depth` fixed monochrome depth field (two faint radial blobs + SVG fractal-noise overlay) rendered once in `Layout.tsx` behind everything. Replaces the deleted purple body haze.
- Theme system 4→2: `Theme = 'ultra-dark' | 'light'`; `migrateTheme()` maps `dark|ultra-dark|unknown→ultra-dark`, `light|solarized→light` (storage key unchanged). `ThemeContext` now sets `data-theme` on `<html>` and toggles `.dark` **only** for ultra-dark (kept so Tailwind `dark:` variants + BlockNote's `classList.contains('dark')` keep working). `themes/ultra-dark.css` deleted; `index.css` imports updated. `Appearance.tsx` shows exactly two theme cards with token-derived previews.
- Glow vocabulary purged from `layout.css` (sidebarGlassDrift animation + glyph accent-halo + dropdown drop-shadow), `utilities.css` (star halo, accent-glow button shadow), `components.css` (green/accent radial fogs, accent-glow shadows), `base.css` (rewritten: Geist body 13px/1.45, heading tracking −0.015em, `.label-caps`). Stock indigo `#6366f1` replaced with brand crimson `#e6455a` across workspace color presets/defaults and removed from CSS fallbacks.

**Verification**
- `npm run lint` → no issues. `npm run build` → green (17s).
- DoD greps: `glow|6366f1|ambient` in `src/` → 0; `!important` in `src/styles/themes/` → 0; stale `theme-ultra-dark|theme-solarized|:root.light` selectors → 0.

**Deviations / known rough spots**
- `text-white` / `bg-white/*` literals were replaced only where they were theme-blind product UI (destructive-button contrast → `--sx-accent-contrast`, workspace glyphs). The remaining literals are in **auth pages** (`bg-black dark:bg-white text-white dark:text-black`, social-icon `text-gray-900 dark:text-white`) and **marketing hover sheens** (`bg-white/10`, hero `text-white/95`) — these are already theme-aware `dark:` pairs or theme-neutral decoration, so they were intentionally left for the auth/marketing pass rather than forced onto tokens.
- This phase is **structural, not finished-looking**: surfaces still use the legacy panel/blur recipes via aliases (the "soap-glass" look persists). The `<Glass>` material that makes them premium lands in Phase 2. Light theme in particular looks transitional because the alias `--sx-panel-rgb: 255 255 255` recipes render near-invisible white-on-white tints until Phase 2/3 move surfaces onto `--sx-surface`.
- Visual dual-theme QA (depth-field appearance, no-purple confirmation in the running app) was **not** done live — the gate run was lint+build per the plan; full visual QA is the Phase 5 deliverable. Recommend a quick manual look in both themes before Phase 2.
- Workspace accent customization (`setAccent`) is still wired and can override the crimson product accent per-workspace; left intact (out of Phase 1 scope).

---

## 2026-06-10 — Phase 1 second iteration hardening

**What changed**
- Pre-hydration theme boot in `index.html` now uses the same two-theme migration as React: `light|solarized → light`, everything else → `ultra-dark`, sets `data-theme`, and only keeps `.dark` for ultra-dark compatibility. Removed stale `light`, `theme-ultra-dark`, and `theme-solarized` class paths from first paint.
- Status/priority metadata now consumes the semantic palette (`--status-*`, `--priority-*`) instead of stock Tailwind hexes/classes. This covers task status dots/pills, task priority flags, project status dots, project priority bars, role badges, copied-invite success icon, subtask completion, icon picker selection, and the old dark editor link fallback.
- Removed the previously deferred TSX `text-white` / `bg-white/*` literals from auth buttons/icons and marketing hover sheens; those now use contract tokens (`--sx-text`, `--sx-canvas`, `--sx-rim-faint`).
- Accent parser fallback now returns the crimson channels `230 69 90` instead of the old indigo fallback.

**Verification**
- `npm run lint` → green.
- `npm run build` → green. Vite emitted only existing advisory warnings: stale Browserslist data and chunks over 500 kB.
- DoD greps: `glow|6366f1|ambient` in `react-frontend/src` → 0; `!important` in `src/styles/themes` → 0; `text-white|bg-white/` in TS/TSX → 0; stale `theme-ultra-dark|theme-solarized|data-theme="dark"|data-theme="solarized"` in `index.html`/`src` → 0.

---

## 2026-06-10 — Phase 2 (Glass material + hero sidebar) complete

**What shipped**
- New material component at `src/shared/ui/glass/`: `Glass.tsx` (CVA-based, polymorphic `as`, ref-forwarding so it wraps `motion.aside`), `glass.css` (the layered `.sx-glass` system), `RefractionFilter.tsx` + `refraction.ts` (capability constant), `index.ts`. Wired `@import "./shared/ui/glass/glass.css"` into `index.css` right after the legacy `glass.css`.
- `<Glass>` construction = body luminance gradient → interior thickness (`inset … --sx-thickness`) → surface noise (`::after`, opacity .35, mix-blend overlay) → light-catching masked rim (`::before`, gradient ring, NOT a border). 7 variants as token-driven custom-prop deltas (`--glass-blur/-radius/-fill-top/-shadow`), no new hues: `sidebar`(36px, raised fill, elevated, radius-xl) `panel/card`(24px) `menu/modal`(40px, strong fill, elevated) `dock`(28px) `pill`(**blur 0**, solid `--sx-surface`, rim-on-hover — Design Law 8). `depth` = shadow tier (rest/raised/floating) independent of rim. `interactive` opt-in: hover fill +2% + `translateY(-1px)`, press `scale(0.985)`, `prefers-reduced-motion` honored.
- Refraction: `feTurbulence`+`feDisplacementMap` (scale 14) SVG mounted once in `Layout`; `.sx-glass--refract` appends `url(#sx-refract)` to backdrop-filter, attached **only** when `SUPPORTS_REFRACTION` passes (Chromium UA + `CSS.supports('backdrop-filter','url(#x)')`). Firefox/Safari/SSR get the plain blur stack.
- Sidebar rebuilt as a **floating glass slab**: `GlobalSidebar.tsx` now `<Glass as={motion.aside} variant="sidebar" depth="floating" refract>`. `layout.css` `.app-sidebar` reduced to geometry only — desktop `position:fixed; inset:12px auto 12px 12px; width:248px`, mobile `position:relative` inside the existing slide-in wrapper. Content offset `ml-[236px]→ml-[272px]` (12+248+12), topbar `left:272px`, pad-top `100→92`. Nav items stripped of all gradient/blur chrome: rest transparent, hover `--sx-surface-hover`, active `--sx-surface-active` + a single 2px crimson tick on the left edge (the only accent in the sidebar). Workspace switcher + dock pills = solid `--sx-surface`, rim-on-hover via inset highlight (no nested blur inside the glass).
- Topbar borderless + `pointer-events:none` so content scrolls under; only the search launcher floats as `<Glass as="button" variant="pill" interactive>` with a `label-caps` ⌘K chip and accent focus ring.
- Legacy recipes in `styles/glass.css` re-implemented on the layer system (same class names → all call-sites upgrade free): `.glass-card`/`.glass-menu` get rim+noise+thickness; `.liquid-button` + `.glass-input` made solid (dropped live blur, accent focus ring); `.glass-pill` solid borderless; `.liquid-button:active` `0.90→0.97`. `.dropdown-menu` (shared by 10 components) unified onto the menu glass material rather than stripped.
- Added two theme-safe tokens to keep variant fills token-driven: `--sx-glass-fill-top-raised` (0.07 dark / 0.72 light) and `--sx-glass-fill-top-strong` (0.10 / 0.85) in `tokens.css` + `themes/light.css`.

**Verification**
- `npm run lint` → no issues. `npm run build` (tsc -b + vite) → green (~19s). Fixed one polymorphic-inference type error by typing `as?: T` inside `GlassProps<T>`.
- Live `backdrop-filter` on a main viewport: sidebar (1) + optional open dropdown (1); topbar search is solid (0). Under the Design-Law-8 cap of 6.
- DoD greps: `--bg-sidebar`/`--border-sidebar` consumers outside token files → 0; `sidebarGlassDrift` → 0.

**Deviations / known rough spots**
- **Dual-theme + refraction visual QA was not run live** (gate was lint+build per plan). Needs a manual look in Chromium (refraction bending under the slab edge) and in Firefox/light (slab must read as white frosted glass with a soft slate shadow, not a gray box) before Phase 3. Reduced from a hard blocker only because Phase 5 owns the full QA gate.
- **Task 2.5 components.css cleanup deferred:** the 19 bespoke hand-rolled `backdrop-filter` surfaces in `components.css` (settings modal/sidebar, profile shell, toast, per-page panels/dropdowns) are NOT duplicates of `.glass-card` — they are distinct surfaces that Phase 3/4 explicitly owns migrating to `<Glass>`. Stripping their blur now would leave overlays see-through mid-redesign, so they were left intact. Flag for Phase 3: migrate these to `<Glass variant="panel|menu|modal">` and delete the inline recipes.
- `.dropdown-menu` kept as a class (shared by 10 call-sites) rather than each becoming `<Glass variant="menu">` — same material, far lower blast radius. Phase 3 can convert structural call-sites where it wraps cleanly.
- Mobile sidebar reuses the same `<Glass>` with `!w-72 !rounded-r-3xl` overrides; functional but the floating-gutter aesthetic is desktop-only by design.

---

## 2026-06-10 — Phase 3 (Content surfaces) complete

**What shipped**
- **Shared chip doctrine (one source):** new `.sx-chip` / `.sx-dot` / `.sx-chip--neutral` classes at the top of `components.css`. Hue comes from inline `color` (the status/priority text token); chip derives fill `color-mix(currentColor 14%)` + a faint `currentColor 22%` ring on hover/open only — no borders, 6px dots. Status pills already fed from the semantic palette (`TASK_STATUS_META.pillClass` + `.dot`) — confirmed as the single source across Tasks, My Issues, Board. Priority/project chips re-pointed onto the same `color-mix(currentColor …)` recipe.
- **`--sx-danger` token added** (`#e0726f` dark / `#c2473f` light) in `tokens.css` + `themes/light.css`, plus `.dropdown-menu-item--danger` in `layout.css`. Replaced every destructive literal in the migrated scope: ProjectRow delete, MyIssues delete, MembersPanel/MembersPage remove + error + invite check, GlobalSidebar logout (`!text-[#fca5a5]`/`rgba(239,68,68…)` → token), tasks `is-overdue`.
- **3.1 Projects** (`WorkspaceProjects`, `projects/ProjectRow`, `.projects-*`/`.project-*`): table shell → `<Glass variant="panel" depth="raised">`; header row = `label-caps` (JetBrains Mono) + single `--sx-line`; rows transparent → `--sx-surface-hover`, radius-sm, **per-row `border-top` removed** and accent hover-tick dropped. Status dot 6px, glow removed; priority-with-label on chip doctrine; progress bar 3px `--sx-line` track with `--sx-text-subtle→muted` gradient (accent reserved per Law 6); glyph flat solid surface; empty-state dashed border → solid surface icon square. Inline dropdowns stripped of hand-rolled blur (material from `.dropdown-menu`).
- **3.2 Tasks explorer + board** (`TaskExplorerContent`, `explorer/*`, `taskBoard/*`, `.tasks-*`): table shell → `<Glass variant="panel">`; docked filter rail → solid `--sx-canvas-elevated`, no border/blur (separation by luminance); toolbar/view-toggle → ghost (transparent → surface-hover, active surface-active, borders gone); table-row `border-bottom` removed, rows radius-sm hover-surface; inline triggers → neutral/tinted chip doctrine (borders → ring-on-hover); inline dot glow removed (6px); calendar menu stripped of hand-rolled blur (uses `.glass-menu`), selected day → accent; overdue → `--sx-danger`. Board: cards → `<Glass variant="card" interactive depth="rest">`, drag overlay `depth="floating"` + `rotate-[1.5deg]`; lanes transparent, drop highlight neutral surface (was `--starlex-accent-*`), empty placeholder dashed → solid.
- **3.3 My Issues** (`MyIssuesPage`): view tabs → text-only with 2px accent underline (`after:` pseudo), no pill backgrounds; rows hover `--sx-surface-hover`; row menu → `.dropdown-menu-item(--danger)`; `--sx-control` skeletons → `--sx-surface`.
- **3.4 Members** (`MembersPanel` + `MembersPage` — both are live: panel embeds in `WorkspacePage`, page is the `/members` route): member list → `<Glass variant="panel">`, **per-row borders + `divide-y` removed**, rows hover-surface; Owner badge → quiet `label-caps` in `--status-done-text` (no crown, no amber pill); role select → neutral chip; invite block → solid `--sx-canvas-elevated` (no double glass); dialogs given token swaps (`--sx-panel/--sx-border` → contract) but full overlay restyle left to Phase 4.
- **3.5 Home bento** (`WorkspaceBento`, `WorkspaceWelcome`, `.workspace-*`): recent panel → `<Glass variant="panel" depth="raised">` (geometry-only CSS); greeting `h1` −0.02em tracking, no panel; rows hover-surface, glyph flat; status dot 6px; "New project" → ghost (dashed/border removed); accent alias → `--sx-accent`.
- **3.6 Auth & onboarding** (all 5 auth pages + `OnboardingPage`): replaced the legacy two-panel serif `auth-shell`/`auth-panel`/underline-`auth-input` layout with a single centered `<Glass variant="modal" depth="floating">` card over the canvas. Inputs → `.glass-input` at `radius-md` (not pill); labels → `label-caps`; primary CTA → accent; OAuth buttons → solid surface; `green-50/red-600`/`dark:dark-*` literals → `--status-done-*`/`--sx-danger`/contract tokens. Onboarding card → `<Glass variant="modal">`, removed accent-tinted CTA shadow (Law 2), `--sx-body-bg` → `--sx-canvas`. Dead `.auth-shell/.auth-panel/.auth-input` CSS deleted; `.auth-page` repointed to `--sx-canvas`.

**Verification**
- `npm run lint` → No issues. `npm run build` (tsc -b + vite) → green (~19s).
- components.css borders 207 → 181; lines 2,906 → 2,888.
- All five named screen blocks (projects list, tasks explorer/board, my-issues, members, home bento) carry **zero** `rgba(255,255,255,…)` — fully theme-token-driven both themes.

**Deviations / known rough spots**
- **DoD border −60% and "components.css < 1,500 lines" NOT met (207→181, ~13%).** Reason: the residual borders/`rgba(255,255,255)` are concentrated in surfaces the plan assigns to **Phase 4**, not Phase 3 — Settings (51 borders / 83 white-rgba), Project-detail page + header (31 / 70), Task-detail panel (17 / 28), Workspace-identity form (14 / 28), Profile (9 / 19), Toasts (4). The five *content-list* surfaces in 3.1–3.6 are migrated and border-clean; the metric is dominated by Phase-4-owned overlay/detail surfaces. Recommend re-baselining this DoD number against Phase 4 (settings/dialogs/toasts) rather than treating it as a Phase-3 miss.
- **Alias removal partial.** `--sx-panel*` / `--sx-control*` / `--bg-*` / `--glass-bg` aliases still have **many live consumers outside Phase-3 scope**: Settings, task-detail (`TaskPropertiesPanel`), project-detail (`ProjectHeader`, `ProjectTaskList`), profile, shared UI (`Button`, `Modal`, `DarkSelect`, `LabelPicker`, `PasswordStrengthMeter`), `SearchModal`/`IconPicker` (⌘K, Phase 4), and the marketing pages (`HomePage`, `AboutUs`, `Dashboard`). Removing the aliases now would break those. Only the genuinely-dead auth aliases were cleared. The `@deprecated` block in `tokens.css` must stay until Phase 4 + a marketing pass migrate their consumers.
- **Dialogs/Selects in Members + Project detail** still use `glass-card … backdrop-blur-2xl` with token swaps only — their full migration to `<Glass variant="modal">` belongs to Phase 4 (overlays). Same for `TaskPropertiesPanel` and the project-detail surfaces (`.project-detail-*`, `.task-*` detail blocks) which remain on hardcoded `rgba(255,255,255)` and will not be theme-correct in light until migrated.
- **Live dual-theme visual QA not run** (gate was lint+build per plan). Phase 5 owns the full QA gate; recommend a manual light/dark pass on the migrated screens (chip ring contrast, progress-bar gradient, board card glass on the lanes) before then.
- Marketing pages (`HomePage`, `AboutUs`, `Dashboard`) untouched — they were deferred to "the auth/marketing pass" in Phase 1 and are not in the Phase-3 product-surface scope.
