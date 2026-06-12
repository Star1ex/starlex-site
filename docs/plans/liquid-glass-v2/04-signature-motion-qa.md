# Phase 4 — Signature Motion & the Real QA Gate

> Prereq: Phases 1–3. Motion tokens/presets from v1 Phase 5 stay the single source — this phase adds the three signature moves v1 deferred, then runs the QA walk that v1 never ran.
> Minimalism rule for this phase: **three signature moves, zero decorative ones.** If a motion idea isn't on this list, it doesn't ship.

---

## 4.1 ⌘K morph — search pill ⇄ palette (View Transitions API)

v1 deferred this because a framer `layoutId` morph across a portal is genuinely hard. Use the View Transitions API instead (already proven in this codebase by the theme cross-dissolve):

- Rest state: the topbar search pill carries `view-transition-name: sx-cmdk`.
- On open: inside `document.startViewTransition(() => { ... })` — remove the name from the pill, mount the palette with `view-transition-name: sx-cmdk` on its `<Glass variant="modal">` shell. On close: inverse. (Two live elements must never hold the name simultaneously or the transition is skipped.)
- CSS in `motion.css`: `::view-transition-group(sx-cmdk) { animation-duration: 280ms; animation-timing-function: var(--ease-out-expo); }`; old/new snapshots crossfade by default — that's the desired glass-stretch look.
- Chromium-only by nature; guard exactly like `ThemeContext.commitThemeToDom` and keep the current fade as fallback. Reduced-motion: skip the transition entirely.

## 4.2 Active nav tick — spring slide

The sidebar's 2px crimson tick currently pops between items. Give it one `framer-motion` `layoutId="sx-nav-tick"` element (inside the sidebar — no portal, so this is the easy `layoutId` case) with `springUI`. The tick *slides* to the new item; labels/rows don't animate. This is the single most-seen motion in the app.

## 4.3 Tier-B press physics

CSS-only, on the shared tier-B recipes (`.sx-glass--pill`, `.sx-glass--card.sx-glass--interactive`, `.liquid-button`, shared `Button`): `:active { transform: scale(0.98); }` + one fill step up, at `--motion-fast`. Verify it doesn't double with framer `whileTap` on the few wrapped call-sites — one source per element, prefer CSS.

## 4.4 Cleanups (10 minutes, bounded)

- Delete the unused `shimmer` keyframe from `tailwind.config.js`.
- Delete the shadcn gray oklch theme block in `styles/shadcn.css` **if** `grep` shows no remaining consumer.
- `GlassVariant`/CSS: confirm `--panel` fully gone (Phase 3 DoD).

## 4.5 THE QA WALK (the deliverable v1 owed)

Run the v1 Phase-5 checklist for real and check every box in PROGRESS.md. Chromium + Firefox, **both themes**:

- [ ] Every route: Home, Projects, Project detail, Tasks (list+board), Task detail, My Issues, Members, Inbox, Settings (all tabs), Profile, Auth, Onboarding, Invite, ⌘K, dialogs, toasts
- [ ] Light theme reads as *transparent glass on white*: sidebar/buttons visibly translucent, defined by edge+shadow, all text comfortable — the owner's acceptance criterion
- [ ] No purple/glow/color fog **anywhere — including hues smeared through glass** (open Settings over every busy page in dark; the `shots/baseline/dark-settings-modal.png` band must be impossible to reproduce) and including chips (Medium/In-Progress are gold now)
- [ ] No uniform 4-side borders — rims read as a top-left light catch (zoom a slab edge to 200%); live blur ≤6 per viewport (count them)
- [ ] No native scrollbars on any scroll container (tasks, my-issues, members, settings inner column, ⌘K results)
- [ ] Contrast floor: `npm run visual-qa` table ≥4.5:1; spot-check chips on tier-B fills
- [ ] Refraction present in Chromium, absent-but-clean in Firefox; brightness chain doesn't clip white in light theme
- [ ] 60fps: 50-row table scroll + 20-card board drag, with parallax active (DevTools FPS meter; if parallax janks, reduce its factor before touching anything else)
- [ ] Keyboard: tab order sidebar→content, focus ring visible on glass and tier B, ESC closes overlays in order
- [ ] Signature set works: ⌘K morph (and falls back cleanly in Firefox), nav tick slides, presses squish, theme cross-dissolves, field drifts on scroll
- [ ] `visual-qa` PNGs for lab + auth committed under `shots/<sha>/` as the after-picture, side-by-side with `shots/baseline-login-light.png`

Anything failing gets fixed in this session — the phase is not "complete with deviations"; this checklist IS the definition of done for the whole plan.

- Commit: `feat(frontend): [glass-v2 4/4] cmdk morph, nav-tick spring, press physics + full dual-theme QA gate`.
