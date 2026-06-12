# Phase 1 — The Lab & the Eyes

> Prereq: none. Read `00-MASTER.md` first.
> Output: a dev-only `/glass-lab` route showing every material in both themes, and `npm run visual-qa` producing PNGs. **No visual changes to the product in this phase.**
> Why first: v1 failed because no phase ever looked at the result (Law 15). The harness is built *before* the material is touched so phases 2–4 tune against real pixels.

---

## 1.1 `/glass-lab` route

- `src/pages/GlassLab/GlassLabPage.tsx`, lazy-imported and registered **only when `import.meta.env.DEV`** (guard in `routes.tsx`; production bundle must not contain it — verify in build output).
- No auth, no API. Renders over the real `.sx-depth` field with the real `<Glass>` component. Mock data inline.
- Theme: read `?theme=light|ultra-dark` from the URL **before first paint** (set `data-theme` in a layout effect at module mount; default ultra-dark). This lets the screenshot script force themes without touching localStorage.
- Sections, top to bottom (each titled with `label-caps`):
  1. **Canvas strip** — bare depth field, 240px tall, so field amplitude itself is reviewable.
  2. **Tier A specimens** — one of each over the field: sidebar slab mock (260×480, real nav-item styles, active tick, workspace pill), `menu` (a real `.dropdown-menu` clone with 5 items, one danger), `modal` (480×300 with title/body/footer buttons), `dock` pill row. Each twice: over the bare field AND over a busy mock content block (text + chips + a fake table) — glass must be judged over content, not just fog.
  3. **Tier B specimens** — buttons (primary accent / default / ghost / danger; rest+hover+active+focus-visible states forced via classes), inputs (rest/focus), chips (every `--status-*` and `--priority-*`), pills, 6 table rows (one hover-forced), 3 board cards, and a 200px-tall scrollable box (so the scrollbar styling from Phase 2 is reviewable in shots).
  4. **Typography block** — h1/h2/body/muted/subtle/label-caps on canvas and on a tier-A slab.
  5. **Contrast row** — `--sx-text-muted` swatches rendered on: canvas, brightest field area, tier-B surface, tier-A glass. (Eyeball AA here; exact check in 1.3.)

## 1.2 Screenshot harness

- `npm i -D playwright-core` (no browser download — it drives an existing Chromium).
- `react-frontend/scripts/visual-qa.mjs`:
  - Chromium resolution order: `process.env.CHROME_EXE` → newest `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` → `/usr/bin/chromium` → `/usr/bin/google-chrome`. Fail with a clear message if none.
  - Starts Vite itself (`npm run dev` on a free port) unless `--url` is passed; waits for ready; kills it after.
  - Shoots `/glass-lab?theme=ultra-dark` and `?theme=light` at 1600×950 `deviceScaleFactor: 1.5`, full-page, → `docs/plans/liquid-glass-v2/shots/<git-short-sha>/lab-{dark,light}.png`.
  - Extra routes via `--routes /login,/register` (used by later phases; auth-walled routes are out of scope — the lab carries the app shell mock instead).
  - `package.json`: `"visual-qa": "node scripts/visual-qa.mjs"`.
- Keep it boring: ~120 lines, no test framework, no CI wiring.

## 1.3 Contrast check (automated floor)

In the same script, after the lab loads: evaluate `getComputedStyle` for the contrast-row swatches and compute WCAG ratio of `--sx-text-muted` vs each sampled background (use canvas `ctx.getImageData` on a screenshot crop for the glass/field cells — simplest reliable way). Print a table; **exit non-zero if any cell < 4.5:1**. This makes Law "tune fills up, never text down" enforceable.

## 1.4 Gate & DoD

- `npm run lint && npm run build` green; `/glass-lab` absent from prod bundle (`grep -r glass-lab dist/` → 0 after build).
- `npm run visual-qa` produces both PNGs; contrast table prints and passes (it will — current material is opaque; the floor exists for phases 2–4).
- The two PNGs are **looked at** and compared against the owner's baseline screenshots in `shots/baseline/` (flat black sea, border-boxed slabs, washed white-on-white, purple smear in `dark-settings-modal.png`, OS scrollbars). Confirm the lab reproduces these failure modes — especially the purple band on the modal-over-busy-content specimen (it is Phase 2's diagnosis target) — and describe the baseline in PROGRESS.md.
- Commit: `feat(frontend): [glass-v2 1/4] glass-lab route + visual-qa screenshot harness`.
