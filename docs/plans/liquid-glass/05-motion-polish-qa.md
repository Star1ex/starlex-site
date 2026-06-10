# Phase 5 — Motion choreography, wow details, dual-theme QA gate

> Prereq: Phases 1–4. This is the difference between "nice redesign" and "how did you build this".
> Skills: `everything-claude-code:frontend-patterns`, `vercel:react-best-practices`; review pass with `react-reviewer` agent at the end.

## 5.1 Motion token system (`src/styles/motion.css` + `shared/lib/animations.ts` rewrite)

```
--motion-fast: 120ms;  --motion-base: 180ms;  --motion-slow: 280ms;
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--spring-ui: { type:"spring", stiffness: 420, damping: 34 }      // framer preset export
--spring-soft: { type:"spring", stiffness: 260, damping: 30 }
```
- Single source: every framer `transition` imports these presets; every CSS transition uses the vars. Delete ad-hoc durations.
- `prefers-reduced-motion`: global `@media` kills transforms (opacity-only) + a `useReducedMotion` gate for framer choreography.

## 5.2 Choreography (replace scattered per-component animations)
- **App entry**: sidebar slab slides in 8px + fade (once per load, not per route); content area fades 0.98→1 scale. Remove per-nav-item stagger delays >0.15s total.
- **Route transitions**: content-only crossfade 140ms via `AnimatePresence mode="popLayout"` on the outlet wrapper — never animate the sidebar/topbar on navigation.
- **List entrance**: rows stagger 12ms/row capped at 10 rows, translateY 4px + fade. Virtuoso lists: entrance only on initial mount.
- **Glass morph** (the skill's `glassEffectID` principle, web version): workspace switcher ⇄ its dropdown, search pill ⇄ ⌘K modal — use framer `layoutId` so the glass slab visually *morphs* between the two states. Two morphs max in the app; they are the signature moves.
- **Hover physics**: cards `whileHover y:-2 + shadow tier up`; buttons `whileTap scale:0.97`; nav items NO x-shift (current `x:3` jiggle reads as cheap — remove).

## 5.3 Wow micro-details (each ≤30 LOC, high perceived value)
1. **Specular cursor tracking** on the sidebar + modal rims: a `radial-gradient` highlight in the rim layer follows `--mx/--my` custom props from one `pointermove` listener (rAF-throttled, sidebar only). Glass that *responds to light* = the Apple tell.
2. **Theme switch transition**: `document.startViewTransition` (guarded) wrapping the data-theme flip → 300ms cross-dissolve of the entire UI instead of a flash.
3. **Status/priority chip change**: dot pops via `layout` spring + color crossfade.
4. **Progress bars** animate width with `--spring-soft` on data change.
5. **Drag-and-drop**: board card lifts (scale 1.03, shadow floating tier, 1.5° tilt), drop settles with spring; column highlight = luminance, not accent.
6. **Skeletons**: replace shimmer-gradient skeletons with static `--sx-surface` blocks + 0.6→1 opacity pulse 1.2s — shimmer = template tell.
7. **Empty-state icons**: single slow float (4s, 3px) — only if reduced-motion off.

## 5.4 Dual-theme QA gate (blocking checklist)
Walk EVERY route in both themes (chrome + firefox), record into `PROGRESS.md`:
- [ ] Home, Projects, Project detail, Tasks (list+board), Task detail, My Issues, Members, Inbox, Settings (all tabs), Profile, Auth pages, Onboarding, Invite, ⌘K, all dialogs/toasts
- [ ] No purple/glow anywhere; no uniform 4-side borders on glass; ≤6 live blur surfaces per view
- [ ] Text contrast: muted text ≥4.5:1 on its surface in BOTH themes (spot-check with devtools); chip text AA
- [ ] Refraction: present in Chromium, absent-but-clean in Firefox/Safari
- [ ] 60fps scroll on a 50+ row table and the board with 20 cards (perf panel)
- [ ] Keyboard: tab order through sidebar→content, focus ring visible on glass, ESC closes layered overlays in order
- [ ] `grep -rn '!important' src/styles | wc -l` → target <10 (document each survivor)
- [ ] `components.css` < 1,200 lines; deprecated aliases gone from tokens.css
- [ ] Bundle: `npm run build` — no new chunk >50kb gz from this redesign (cmdk/sonner are small; verify)

## 5.5 Final review & docs
- Run `react-reviewer` agent on the full diff of phases 1–5; fix CRITICAL/HIGH.
- Update `CLAUDE.md` frontend section: token contract location, `<Glass>` usage rules, Design Laws link.
- Update `docs/plans/liquid-glass/PROGRESS.md` final entry + before/after screenshot pairs.

Commit: `feat(frontend): [glass 5/5] motion system, signature morphs, dual-theme QA pass`

## After this plan
Run `FRONTEND-REVIEW-01-REFACTOR-CLEANUP.md` and `FRONTEND-REVIEW-02-PERFORMANCE.md` as follow-up sessions — they are complementary (dead code, bundle, data loading) and now operate on a stable design system.
