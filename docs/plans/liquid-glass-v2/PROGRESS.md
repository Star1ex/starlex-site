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
