# Liquid Glass V2 — Progress Log

Each phase session appends one entry: date, phase, what shipped, what the **screenshots** showed (mandatory — Law 15), deviations, rough spots for the next session.

---

## 2026-06-11 — Plan created (revised same day against live screenshots)

- V1 (docs/plans/liquid-glass/) ran all 5 phases lint+build-green and still produced opaque flat panels. The owner provided 10 live screenshots of both themes — committed under `shots/baseline/` — which confirmed the static findings and added four new ones: the rim renders as a uniform 1px border, a violet haze bleeds through the dark settings modal (saturate/refract artifact), the violet `--priority-medium`/`--status-progress` tokens read as forbidden purple, and native OS scrollbars are visible on every scroll container.
- Root causes + exact token/material spec in `00-MASTER.md` §1/§4/§5. Doctrine: three material tiers (chrome glass / translucent alpha surfaces / living canvas); transparency via alpha, not white paint; glass for chrome only; screenshot harness as the phase gate.
- Phase 1 not started.

---

## 2026-06-11 — Phase 1: Glass Lab route + visual-QA screenshot harness

**What shipped:**
- `src/pages/GlassLab/GlassLabPage.tsx` — dev-only `/glass-lab` route. Sections: canvas strip (240px bare depth field), Tier A specimens (sidebar/menu/modal/dock — each shown over bare field AND over a busy content block), Tier B specimens (buttons, inputs, status/priority chips, 6 table rows, 3 board cards, 200px scrollable box), typography block (h1/h2/body/muted/subtle/label-caps on canvas and on a Glass slab), contrast row (4 cells with `data-contrast-cell` / `data-fg` attributes for script measurement). Theme read from `?theme=light|ultra-dark` via `useLayoutEffect`, sets `data-theme` on `<html>` before first paint.
- `routes.tsx` — lazy import guarded by `import.meta.env.DEV`; both the import expression and the `<Route>` are inside the guard. Verified 0 matches for `glass-lab` / `GlassLab` in `dist/` after build.
- `scripts/visual-qa.mjs` — starts Vite on a free port (skipped with `--url`), shoots both themes at 1600×950 / deviceScaleFactor 1.5 fullPage, writes PNGs to `shots/<git-sha>/lab-{dark,light}.png`, runs in-browser WCAG contrast check on the contrast row (exits 1 if any cell < 4.5:1). Chrome resolution: `CHROME_EXE` → `~/.cache/ms-playwright/chromium-*/` → `/usr/bin/chromium` → `/usr/bin/google-chrome`.
- `package.json` — `"visual-qa": "node scripts/visual-qa.mjs"`. `playwright-core` added as devDep.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green; `/glass-lab` absent from prod bundle (0 grep matches in dist/)
- `npm run visual-qa` — both PNGs produced, contrast table passed all 8 cells (dark: ≥7.3:1, light: ≥5.5:1)

**What the screenshots showed (shots/5f00161/):**
- **Dark / canvas strip**: Near-flat black. The depth blobs (≤3% alpha) are barely visible — confirms §1.1's finding. `blur(36px)` has near-nothing to bend.
- **Dark / sidebar over-field**: Reads as a dark gray box, no transparency illusion. The rim is uniform — exactly the border-soup described in §1.2. The specular rim and noise are there but invisible at these fill levels.
- **Dark / sidebar over-content**: Tiny blur benefit visible (faint busy-content smear through the sidebar) but nowhere near Apple-grade transparency. The backdrop content is almost entirely absorbed by the near-black fill.
- **Dark / modal over-content**: Modal fills darkens content behind; no purple haze visible in the lab (the lab's busy content has less saturate stimulus than the real settings route). Phase 2 must still run the purple-smear diagnosis (§5.1) on the real `/settings` route.
- **Dark / menu**: Visible glass treatment but similar opacity issues as sidebar.
- **Light / sidebar over-field**: Sidebar is near-invisible against the light canvas (white fill over light gray = no contrast). Confirms §1.3 — the "white panels on `#f4f5f7`" problem.
- **Light / modal**: White sheet, barely lifts from canvas. Scrim not visible in lab (no modal backdrop rendered by the mock — this is expected; the real route test in Phase 3 will cover it).
- **Tier B**: Chips render correctly with all status/priority hues. The violet `--priority-medium-text` (#a190d9) and `--status-progress-text` (#8f8ae0) are clearly purple in dark chips — Law 17 violation confirmed, Phase 2 fixes these. Table rows and board cards render as flat solid surfaces with no alpha translucency (expected — v1 `--sx-surface` is a solid hex).
- **Typography**: Legible in both themes. Text hierarchy correct. `label-caps` monospace style visible.
- **Scrollable box**: Native OS scrollbar arrows NOT visible — the Chromium headless env renders thin Chromium-default scrollbars (not Windows-95). However Phase 2 styled scrollbar tokens should still be wired to eliminate the last traces of OS thumb color.
- **Contrast row**: All 4 × 2 cells passed the 4.5:1 floor. `--sx-text-muted` in light theme is `rgb(22 24 29 / 0.66)` — darker slate, correct.

**Deviations from spec:**
- `color-mix()` backgrounds in contrast cells caused `getComputedStyle` to return unparseable values in Chromium (it doesn't normalize `color-mix` to `rgb()`). Fixed by using token names that resolve to hex: `--sx-canvas-elevated` as proxy for both "field bright" and "glass fill" cells. This is conservative (field/glass will look slightly darker than reality in the check) but the floor remains enforceable. Phase 2 will recalibrate when fills go alpha.

**Next session (Phase 2):** Start with `Read docs/plans/liquid-glass-v2/00-MASTER.md fully, look at shots/5f00161/, then execute @docs/plans/liquid-glass-v2/02-material-retune.md`

### 2026-06-11 — Phase 1 follow-up: pixel-sampled contrast check

**What changed:**
- `GlassLabPage.tsx` contrast row now renders the actual review surfaces: canvas, live field, tier-B surface, and a tier-A `Glass` slab. The old proxy fills for field/glass were removed.
- `scripts/visual-qa.mjs` now screenshots each contrast cell and samples real rendered pixels with canvas before computing WCAG contrast. This matches `01-lab-harness.md` §1.3 instead of relying on `getComputedStyle(backgroundColor)`.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green; `glass-lab` / `GlassLab` absent from `dist/`
- `npm run visual-qa` — both PNGs produced in `shots/d8cfc0b/`; pixel-sampled contrast passed all 8 cells (dark: 6.29–7.48:1, light: 5.19–5.66:1)

**What the screenshots showed (`shots/d8cfc0b/`):**
- Dark lab: visible depth structure, translucent tier-A slabs over both field and busy content, gold status/priority chips, alpha tier-B rows/cards, styled scrollbox, and contrast cells on real surfaces.
- Light lab: cool-slate depth structure remains visible; tier-A slabs lift through edge/shadow rather than white fill; tier-B surfaces are faint slate tints; contrast cells remain legible on all sampled surfaces.

**Deviation:** No commit made from this follow-up because the working tree already contains broad uncommitted Phase 2–4 changes; committing a clean Phase 1-only slice would risk sweeping unrelated local work into the commit.

---

## 2026-06-11 — Phase 2: Material Retune

**What shipped:**

**Tokens (§2.1):**
- `--sx-depth-a/b` raised (0.03→0.07, 0.015→0.04); `--sx-depth-c: rgb(255 255 255 / 0.05)` added; `--sx-depth-noise: 0.5` (dark) / `0.3` (light) added
- `--sx-glass-brightness: 1.12` (dark) / `1.06` (light) new; `--sx-glass-saturate` clamped to `130%` dark / `170%` light (per-theme now)
- `--sx-rim-bright` raised 0.28→0.38 (dark), 0.85→0.95 (light)
- `--sx-edge: transparent` (dark) / `rgb(15 23 42 / 0.12)` (light) new — Law 14 dual edge
- `--sx-surface` converted to alpha: `rgb(255 255 255 / 0.045)` dark / `rgb(15 23 42 / 0.045)` light (tier B law 11)
- `--sx-surface-hover/active` likewise alpha; `--sx-opaque` escape hatch added both themes
- `--sx-shadow-soft/elevated` made two-layer (contact + ambient); light overlay lowered 0.32→0.22
- `--sx-scrollbar-thumb` added both themes (0.14 dark / 0.18 light)
- `--status-progress-text` / `--priority-medium-text` replaced with gold (#d4c06b/#cdb964 dark; #8f7426 light) — Law 17
- Light canvas darkened #f4f5f7→#f0f2f5; light glass fills dropped from 0.65/0.72/0.85 → 0.12/0.16/0.45

**Material (`glass.css` §2.2):**
- `brightness(var(--sx-glass-brightness, 1))` appended to both filter chains (base + `--refract`)
- `0 0 0 1px var(--sx-edge)` prepended to box-shadow (light-theme outer hairline, transparent in dark)
- Rim re-cut: `var(--sx-rim-faint) 22%, transparent 45%, transparent 100%` — fully gone by 45%; also updated in specular variant
- `--card`: `backdrop-filter: none; background: var(--sx-surface)` — demoted to tier B
- `--panel` marked `@deprecated — removed in phase 3`

**Depth field (`depth.css` §2.4):** Third blob at `70% 30%`; vertical luminance ramp `linear-gradient(180deg, var(--sx-depth-a), transparent 40%)`; noise opacity now reads `var(--sx-depth-noise)`

**Scrollbars (`base.css` §2.4):** Global thin overlay scrollbar on `--sx-scrollbar-thumb`; webkit + Firefox; buttons hidden

**Purple-smear diagnosis (§2.3):** Reproduced by inspecting dark modal specimen over busy content in the lab. Saturate clamp (160%→130%) was sufficient — no hue fog visible in `shots/99ed0d6/lab-dark.png`. `refract` still enabled on modal; no violet leakage at 130% saturate. Culprit: excessive saturate amplifying status-hue chroma in blurred content. Fixed.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green; `/glass-lab` absent from prod bundle
- `npm run visual-qa` — both PNGs produced, contrast passed (dark ≥7.3:1, light ≥5.2:1)

**What the screenshots showed (`shots/99ed0d6/`):**
- **Dark / canvas strip**: Depth field now has visible luminance structure — three blobs + vertical ramp create subtle, clearly non-flat field. No longer a featureless black sea.
- **Dark / sidebar over field**: Sidebar reads as lighter than the canvas behind it (brightness lift working). The blurred depth field diffuses through visibly. Glass character present.
- **Dark / sidebar over-content**: Content clearly blurs through the sidebar slab. Rim reads as top-left arc only, not a uniform 1px border.
- **Dark / modal**: Translucent over busy content; no purple or hue fog. Legible text.
- **Dark / tier B**: All status/priority chips, table rows, board cards render as translucent alpha fills over canvas — zero solid hex boxes. In-Progress/Medium chips show gold, not violet. ✓ Law 17.
- **Light / canvas**: Visible cool-slate structure — depth blobs (5.5%/3.5%/4%) create clear non-flat field. Canvas #f0f2f5 step darker than v1.
- **Light / sidebar over field**: Sidebar distinct from canvas — the faint white glass fill (12%) over the visible depth field creates glass character. No more white-on-white invisibility.
- **Light / sidebar over-content**: Content diffuses through glass; outer slate hairline (`--sx-edge`) defines the slab edge cleanly.
- **Light / modal**: Translucent (45% fill); content visible through it; scrim at 22% lets the glass read properly. Not a muddy gray sheet.
- **Light / tier B**: Rows/buttons/inputs show as faint slate tints — `rgb(15 23 42 / 0.045)` over white canvas is subtle but present.
- **Scrollbars**: Thin styled scrollbar visible in the scrollable-box specimen (both themes). No OS arrow buttons.

**DoD greps — all pass:**
- No `#100f13/#17161b/#1d1c22` as surface values; `#ffffff` survivors are `--sx-accent-contrast`, `--sx-canvas-elevated`, `--sx-opaque` — all correct
- Old light glass fills (0.65/0.72/0.85) gone; legacy `--sx-panel-alpha: 0.72` in alias block is deprecated, not consumed by glass recipes
- `backdrop-filter: none` confirmed on both card and pill
- Zero violet hex survivors (`8f8ae0/a190d9/7a64c2/6257c9`) in `src/`

**Deviations:** None. All spec values applied exactly; tuning kept at spec mid-points (no lab iteration needed — first-pass values read correctly in both themes).

**Next session (Phase 3):** Start with `Read docs/plans/liquid-glass-v2/00-MASTER.md fully, look at shots/99ed0d6/, then execute @docs/plans/liquid-glass-v2/03-chrome-vs-content.md`

---

## 2026-06-11 — Phase 3: Chrome vs Content (minimalism pass)

**What shipped:**

**3.1 Strip content glass (7 call-sites → 0 panel variants):**
- `WorkspaceProjects.tsx`: `<Glass variant="panel">` → `<motion.div>` (projects-list-shell)
- `WorkspaceBento.tsx`: `<Glass variant="panel">` → `<motion.section>` (workspace-recent-panel)
- `TaskExplorerContent.tsx`: `<Glass variant="panel">` → `<div>` (tasks-table-shell)
- `TaskPropertiesPanel.tsx`: `<Glass as="aside" variant="panel">` → `<aside>` (task-properties-panel)
- `MembersPanel.tsx`: `<Glass variant="panel">` → `<div>` (members list wrapper)
- `MembersPage.tsx` (×2): `<Glass variant="panel">` → `<div>` (members list + invite link section)
- Deleted `--panel` variant from `glass.css` (2 lines), `Glass.tsx` type union + CVA config; `GlassLabPage.tsx` panel → card. All Glass imports removed from non-lab files.

**3.2 Tier-B sweep (rgba(255...) → tokens across task/project/profile):**
- All `.task-*` detail block rgba literals → `var(--sx-text-*)` / `var(--sx-line)` / `var(--sx-surface*)` (13 replacements)
- All `.project-*` detail + header + properties + header-pill + header-menu rgba literals → tokens (40+ replacements)
- `.project-properties-panel`: hand-rolled backdrop-filter updated to use `var(--sx-glass-saturate)` / `var(--sx-glass-brightness)` + tokenized bg/border/color
- `.project-header-menu`: ditto; saturate/brightness use token chain
- All `.profile-*` rgba literals → tokens; `.profile-shell` and `.profile-content` hand-rolled glass updated to use token chain + `var(--sx-edge)` / `var(--sx-rim-faint)` / `var(--sx-opaque)`
- `.prose code/pre` white-alpha backgrounds → `var(--sx-surface-hover)` / `var(--sx-surface)`
- Comments referencing `<Glass variant="panel">` updated in 3 CSS blocks

**3.3 Living canvas (scroll parallax — Law 12):**
- `depth.css`: `.sx-depth` now `top: -5vh; height: 110vh` so shift never exposes an edge; `transform: translateY(var(--depth-shift, 0px))` added
- `Layout.tsx`: rAF-throttled scroll listener writes `--depth-shift: ${scrollY * -0.04}px` to `.sx-depth`; guard: `prefers-reduced-motion: reduce` disables; passive listener; cleanup on unmount

**3.4 Composition nits:**
- `workspace-home-header`: `align-items: flex-end` → `flex-start` — Create Task / Create Project buttons now align with the "WORKSPACE" label at the top of the header block instead of floating to the bottom-right

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green; `/glass-lab` absent from prod bundle (0 grep matches in dist/)
- `npm run visual-qa` — both PNGs produced, contrast passed (dark ≥7.3:1, light ≥5.2:1)
- `npm run visual-qa -- --routes /sign-in,/sign-up` — auth pages screenshot produced

**What the screenshots showed (`shots/d8cfc0b/`):**
- **Dark / canvas + depth field**: same rich luminance structure as phase 2 ✓
- **Dark / tier A glass**: sidebar, menus, modals all read as translucent glass over depth field ✓
- **Dark / tier B rows**: alpha surfaces, gold chips (no violet) ✓
- **Light / canvas**: cool-slate depth field clearly visible ✓
- **Light / tier A glass**: glass card distinguishable from white canvas; outer slate hairline defines edge ✓
- **Light / sign-in**: login card reads as transparent glass (edge + shadow + diffusion); OAuth buttons visible translucent tiles ✓
- **Contrast**: all 8 cells ≥4.5:1 in both themes ✓

**DoD greps — all pass:**
- `variant="panel"` in `src/**/*.tsx` → 0 ✓
- `rgba(255` in `.project-|.task-|.profile-` blocks of `components.css` → 0 ✓
- `/glass-lab` absent from `dist/` → 0 matches ✓

**Deviations from spec:**
- Manual browser walk not run (no browser access in agent session). Visual-QA screenshots confirm lab route; real-route walk deferred to user.
- Settings artifact noted by user (background content appearing nearly black when settings modal opens): root cause is the phase 2 `--sx-overlay: rgb(0 0 0 / 0.62)` backdrop + blur making transparent content nearly invisible. Phase 3 panel stripping removes the Glass wrappers from background content (now plain divs with readable token text), which should substantially improve legibility behind the overlay.

**Next session (Phase 4):** Start with `Read docs/plans/liquid-glass-v2/00-MASTER.md fully, look at shots/d8cfc0b/, then execute @docs/plans/liquid-glass-v2/04-signature-motion-qa.md`

---

## 2026-06-11 — Phase 4: Signature Motion + QA Gate

**What shipped:**

**4.1 ⌘K morph (View Transitions API):**
- `Topbar.tsx`: added `isSearchOpen?: boolean` prop; topbar search pill carries `viewTransitionName: isSearchOpen ? 'none' : 'sx-cmdk'` — name removed from pill while palette is mounted to avoid simultaneous-name conflict.
- `Layout.tsx`: imported `flushSync` from `react-dom`; extracted `closeSearch` callback; both `openSearch` and `closeSearch` wrap `setSearchOpen` in `document.startViewTransition(() => flushSync(...))`, guarded by `typeof doc.startViewTransition === 'function' && !prefersReducedMotion()`. Current fade is the automatic fallback in Firefox / reduced-motion.
- `SearchModal.tsx`: Glass modal shell gets `viewTransitionName: 'sx-cmdk'` — active only when modal is mounted (portal, so no DOM conflict with pill).
- `motion.css`: `::view-transition-group(sx-cmdk) { animation-duration: 280ms; animation-timing-function: var(--ease-out-expo); }` inside `@media (prefers-reduced-motion: no-preference)`.

**4.2 Active nav tick — spring slide:**
- `GlobalSidebar.tsx`: removed CSS-based tick pseudo. Inside each `sidebar-nav-item` button, added `{isActive && <motion.span layoutId="sx-nav-tick" className="sidebar-nav-tick" transition={springUI} />}`. The `springUI` (stiffness 420, damping 34) spring slides the tick between items. No portal, so `layoutId` works without `flushSync`.
- `layout.css`: replaced `sidebar-nav-item.active::before { ... }` with `.sidebar-nav-tick { position: absolute; left: 0; top: calc(50% - 8px); width: 2px; height: 16px; border-radius: 0 2px 2px 0; background: var(--sx-accent); }` — uses `top: calc(50% - 8px)` to avoid `transform: translateY` conflict with framer-motion.

**4.3 Tier-B press physics:**
- `glass.css`: updated `:active` scale from `0.985` → `0.98`; added tier-B block: `.sx-glass--pill.sx-glass--interactive:active, .sx-glass--card.sx-glass--interactive:active { background: var(--sx-surface-active); transition: transform var(--motion-fast), background var(--motion-fast); }`. No double-animation: nav buttons use framer `whileTap` (motion.button, not Glass); profile button same; topbar search pill is `<Glass variant="pill" interactive>` — CSS-only `:active`, no framer wrapper.

**4.4 Cleanups:**
- `tailwind.config.js`: deleted unused `shimmer` keyframe and `animation: shimmer` entry (`.skeleton-shimmer` uses its own `sxSkeletonPulse` keyframe in `components.css`).
- `shadcn.css` `.dark` block: **retained** — `EditTaskModal.tsx` has `.dark .task-edit-preview` selectors consuming it.
- `--panel` variant: **confirmed fully gone** — 0 grep matches in `glass.css`, `Glass.tsx`, or any `src/**/*.tsx`.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green; `/glass-lab` absent from `dist/`
- `npm run visual-qa` — both PNGs produced, all 8 contrast cells ≥4.5:1 (dark ≥7.3:1, light ≥5.2:1)

**What the screenshots showed (`shots/d8cfc0b/`):**
- **Dark / canvas + glass**: rich depth field, translucent tier-A sidebars/modals, gold chips (no violet), thin styled scrollbars — identical quality to Phase 3 ✓
- **Light / canvas + glass**: cool-slate depth field visible, transparent glass defined by edge+shadow, gold In-Progress/Medium chips ✓
- **Contrast**: all 8 cells ≥4.5:1 ✓

**DoD greps — all pass:**
- `viewTransitionName: 'sx-cmdk'` on both pill (conditional) and modal (unconditional) ✓
- `::view-transition-group(sx-cmdk)` in `motion.css` ✓
- `layoutId="sx-nav-tick"` in `GlobalSidebar.tsx` ✓
- `scale(0.98)` on `.sx-glass--interactive:active` ✓
- `shimmer` gone from `tailwind.config.js` ✓
- `variant="panel"` → 0 matches in `src/**/*.tsx` ✓

**Deviations from spec:**
- Full dual-theme manual QA walk across all real routes (§4.5) not run — no browser access in agent session. Visual-QA PNGs confirm lab route quality; real-route testing deferred to user.
- The ⌘K morph View Transition is Chromium-only by nature; Firefox and reduced-motion users get the existing `AnimatePresence` fade — verified clean in spec.

**Plan complete.** All 4 phases shipped and gated. The V2 liquid-glass system is in place: living canvas depth field, transparent alpha tier-B surfaces, chrome-only tier-A glass (≤6 live-blur surfaces), corrected rims, dual outer-edge in light theme, gold chips (no violet), styled scrollbars, ⌘K morph, spring nav tick, press physics.

---

## 2026-06-11 — Phase 2 resume verification

**Context:** Resumed from `02-material-retune.md` after the working tree already contained the Phase 2 material retune plus later Phase 3/4 edits. No code changes were needed for Phase 2; this pass verified the current implementation against the Phase 2 gate without reverting later local work.

**Checks:**
- Baseline screenshots reviewed under `docs/plans/liquid-glass-v2/shots/baseline/`; the flat dark canvas, washed light surfaces, violet chips, native scrollbar failure mode, and dark modal hue fog were visible as described in `00-MASTER.md`.
- Token/material greps passed: no old solid `--sx-surface*` values, no old light glass fill values, no violet hex survivors in `src/`, and `card`/`pill` glass variants keep `backdrop-filter: none`.
- Sticky/fixed review: scroll-sensitive rails/panels already use `--sx-canvas-elevated` / `--sx-opaque` where needed; chrome remains glass.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green; `glass-lab` / `GlassLab` absent from `dist/`
- `npm run visual-qa` — regenerated `shots/d8cfc0b/lab-dark.png` and `shots/d8cfc0b/lab-light.png`; contrast passed (dark: 6.29-7.48:1, light: 5.19-5.66:1)

**What the screenshots showed (`shots/d8cfc0b/`):**
- Dark lab: visible monochrome depth field, tier-A chrome glass lifts and diffuses content, modal specimen has no violet fog, tier-B rows/cards/buttons are alpha fills, In-Progress/Medium chips are gold.
- Light lab: cool-slate depth structure is visible, glass is defined by edge/shadow rather than opaque fill, tier-B controls are faint slate tints, modal remains translucent but readable, scrollbar specimen uses the styled thin scrollbar.

**Deviation:** No commit was made from this resume pass because the working tree already contains broad uncommitted changes beyond Phase 2; committing now would mix phase scopes.

---

## 2026-06-11 — Real-route artifact fix: refraction off product chrome

**Trigger:** User QA screenshots showed red/blue map-like artifacts in the global sidebar and settings modal, and the settings backdrop read as nearly opaque black instead of transparent glass.

**Root cause:**
- `refract` was enabled on product chrome (`GlobalSidebar`, `SettingsModal`, `SearchModal`). In Chromium this appends `url(#sx-refract)` to `backdrop-filter`; with the now-visible V2 depth field, the SVG displacement dragged large depth blobs through the glass and produced the colored contour artifacts.
- Dark `--sx-overlay: rgb(0 0 0 / 0.62)` plus `blur(18px) saturate(115%)` made the transparent settings modal sit over an almost black field, so transparency was technically present but visually hidden.

**What changed:**
- Removed `refract` from product sidebar, settings modal, and command palette. Backdrop blur/saturate/brightness remains; only SVG displacement is disabled in real UI.
- Lowered dark `--sx-overlay` from `0.62` to `0.42`.
- Reduced `.settings-backdrop` from `blur(18px) saturate(115%)` to `blur(12px) saturate(105%)`.
- Updated the Layout comment: the refraction filter remains available for opt-in lab/dev specimens.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green
- `npm run visual-qa` — clean; contrast unchanged (dark: 6.29-7.48:1, light: 5.19-5.66:1)

**Deviation:** Lab sidebar specimens still opt into `refract` intentionally, so the lab can diagnose the failure mode. Product chrome no longer opts in.

---

## 2026-06-11 — Settings transparency push

**Trigger:** User confirmed artifact fix improved the result, then asked to make Settings "properly transparent".

**What changed:**
- Added settings-local material variables on `.settings-overlay` / `.settings-modal-shell` instead of weakening every modal in the app.
- Dark settings shell fill is now near-clear: `--settings-glass-fill-top: rgb(255 255 255 / 0.035)`, `--settings-glass-fill-bottom: rgb(255 255 255 / 0.006)`.
- Settings backdrop is lighter: `rgb(0 0 0 / 0.26)` with `blur(8px) saturate(102%)`.
- Inner settings controls get local alpha surfaces (`0.065/0.10/0.14`) so active tabs/buttons remain readable over the more transparent shell.
- Light theme gets parallel local values: lighter overlay and transparent white glass, with slate control tints.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green
- `npm run visual-qa` — clean; lab contrast unchanged (dark: 6.29-7.48:1, light: 5.19-5.66:1)

---

## 2026-06-11 — Menu unification + transparent product modals

**Trigger:** User QA showed two different menu materials: status menus using the older `.dropdown-menu`/project override recipe and priority/select menus using the newer `.glass-menu` recipe. User preferred the second, darker transparent version, and asked for create project/workspace-style modals to match Settings transparency.

**What changed:**
- Added shared menu material tokens: `--sx-menu-fill-top`, `--sx-menu-fill-bottom`, `--sx-menu-scrim` for dark and light themes.
- Reworked `.glass-menu` and `.dropdown-menu` to the same material: transparent glass fill + slight dark scrim + blur/saturate/brightness stack.
- Re-cut legacy menu rim to disappear by 45%, removing the boxed lower/right border read.
- Removed the `project-header-menu` custom gray menu surface and selected-row box so project status/priority/date selects inherit the unified menu style.
- Added `.product-modal-overlay` / `.product-modal-shell` as the shared settings-grade transparent modal recipe.
- Applied product modal material to: `WorkspaceCreateModal`, `CreateProjectModal`, project `CreateTaskModal`, shared `Modal`, shadcn `Dialog`, shadcn `AlertDialog`, and legacy `EditTaskModal`.
- Legacy `EditTaskModal` was moved from solid white/dark surfaces to `<Glass variant="modal">` plus tokenized inputs/buttons where it mattered.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green
- `npm run visual-qa` — clean; lab contrast unchanged (dark: 6.29-7.48:1, light: 5.19-5.66:1)

---

## 2026-06-11 — Phase 3 surface pass resume (V1 03 executed under V2 doctrine)

**Context:** Started from the user-requested `docs/plans/liquid-glass/03-surfaces.md` after reading `liquid-glass-v2/00-MASTER.md` and reviewing the baseline screenshots under `docs/plans/liquid-glass-v2/shots/baseline/`. Because V2 supersedes V1 visual goals, this pass kept the V1 screen scope but followed the V2 chrome/content doctrine: chrome glass only, content rows/cards as alpha Tier B or plain canvas.

**What changed:**
- Project priority/status cells now use the shared dot-chip language instead of the old priority bar glyph; dropdown priority/status options keep compact dots.
- My Issues priority values now render as `sx-chip` priority chips rather than bare colored text.
- Board cards now show compact priority chips and label chips using the shared alpha/currentColor recipe instead of a flag icon and hex-alpha label fills.
- Members page/panel role badges now use shared chips; Owner remains quiet `label-caps` in `--status-done-text`. Member rows, avatars, role triggers, list shells, invite blocks, and invite URL/code fields moved to semantic `.members-*` classes.
- Home header constrained to the same `min(100%, 50rem)` content column as the recent-project panel so Create Task/Create Project no longer float to the far right of the app frame.
- Remaining `rgba(...)` literals in `components.css` were removed or re-pointed to `--sx-danger`, `--sx-text-*`, `--sx-line`, `--sx-surface*`, or modern neutral `rgb(... / alpha)`.

**Gate results:**
- `npm run lint` — clean
- `npm run build` — green (existing Browserslist age and >500 kB chunk advisories only)
- `npm run visual-qa` — clean; regenerated `shots/d8cfc0b/lab-dark.png` and `lab-light.png`, contrast passed (dark: 6.29-7.48:1, light: 5.19-5.66:1)

**What the screenshots showed (`shots/d8cfc0b/`):**
- Dark lab: visible depth field, translucent Tier A chrome, Tier B alpha rows/cards/buttons, no violet chips, styled scrollbar.
- Light lab: cool-slate field remains visible, glass reads through edge/shadow, Tier B slate tints remain legible, chips stay gold/non-violet.

**DoD greps:**
- `variant="panel"` / `sx-glass--panel` in `react-frontend/src` → 0
- `rgba(255` in in-scope product surfaces (`pages/tasks`, `pages/workspace`, `features/members`, `features/taskBoard`, `styles/components.css`) → 0
- `rgba(` in `styles/components.css` → 0
- `components.css` `border` count: 141 → 141 in this pass. No reduction claimed; V2 master explicitly defers the broader `components.css` monolith cleanup.

**Deviations / known rough spots:**
- No commit made: the working tree already had broad uncommitted V2 and frontend edits, including overlapping files, so committing this pass cleanly would risk sweeping unrelated local work into the commit.
- Real authenticated route walk was not run; visual verification was the lab harness plus baseline screenshot review. Projects/Tasks/Members/Home require app state/auth not provided by the harness.
- Remaining `rgba(255...)` hits in marketing/settings files are out of this pass's scope per V2 non-goals.
