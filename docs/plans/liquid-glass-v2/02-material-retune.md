# Phase 2 — Material Retune (the transparency fix)

> Prereq: Phase 1 harness. Read `00-MASTER.md` §4–§5 first — they ARE the spec; this file is the execution order. Baseline to beat: `shots/baseline/` (the owner's screenshots of v1).
> Output: both themes actually read as liquid glass **in the lab**. Product call-sites untouched (token re-values flow everywhere automatically).

---

## 2.1 Tokens

Apply §4.1 + §4.2 exactly: `styles/tokens.css` (`:root`) and `styles/themes/light.css`. New tokens to declare in both: `--sx-depth-c`, `--sx-depth-noise`, `--sx-glass-brightness`, `--sx-edge`, `--sx-opaque`, `--sx-scrollbar-thumb`. Re-valued: surfaces→alpha, glass fills, rim, shadows (two-layer), saturate (per-theme), overlay (light), **the two violet tokens** (`--status-progress-text`, `--priority-medium-text` → gold, Law 17).

Then chase the alpha-surface fallout (Law 11):
- `grep -rn "sticky\|position: fixed" src/styles src/` → any surface that scrolling content slides *behind* while it must stay readable (table headers, docked filter rail, settings modal header) gets `--sx-opaque` or `--sx-canvas-elevated` instead of `--sx-surface`. Decide per case **by looking at the lab/app, not by grep alone**.
- `--status-canceled-bg` / `--priority-none-bg` reference `--sx-surface` — fine as alpha, just verify chips still read.
- The legacy alias block re-points automatically (`--sx-panel`, `--sx-control`, `--bg-tertiary` → `--sx-surface` etc.) — that's intended; do not touch the aliases.

## 2.2 Material (`shared/ui/glass/glass.css`)

Per §5.1–§5.4:
1. Add `brightness(var(--sx-glass-brightness, 1))` to both filter chains (base + `--refract`).
2. Add `0 0 0 1px var(--sx-edge)` as the first box-shadow entry.
3. **Re-cut the rim** per §5.3 — fully transparent from 45% down. Check at 200% zoom in the lab shot: if any slab still reads as a uniform 1px box (the `shots/baseline/dark-members.png` look), iterate (Law 16).
4. `--card`: remove its blur (becomes tier B): `backdrop-filter: none`, `background: var(--sx-surface)`, keep rim/noise/hover-lift behavior. `--pill`: switch `background` from solid to `var(--sx-surface)` (now alpha).
5. Mark `--panel` with a `/* @deprecated — removed in phase 3 */` comment. No other variant changes.

## 2.3 Purple-smear diagnosis (Law 17 — the `dark-settings-modal.png` bug)

In the lab, modal specimen over the busy content block, ultra-dark. Reproduce the violet band, then isolate by toggling one at a time: `saturate` → 100% · `refract` off · noise layer off. Fix at the source found — expected outcome is some combination of the §4.1 saturate clamp (130%) and dropping `refract` from the `modal` variant. Record the culprit in PROGRESS.md. **Ship nothing that shows hue fog behind glass in either theme.**

## 2.4 Depth field (`styles/depth.css`) + scrollbars (`styles/base.css`)

- Depth per §5.5: third blob + vertical ramp; noise opacity ← `--sx-depth-noise`. No parallax yet (phase 3).
- Scrollbars per §5.6: global thin overlay scrollbar on the contract token, webkit + Firefox syntax, buttons removed. Kill the OS scrollbar seen in `shots/baseline/light-tasks.png` / `dark-my-issues.png`.

## 2.5 The tuning loop (the actual work)

Repeat until right — this is a *seeing* phase, budget most of the session here:

```
edit token → npm run visual-qa → open lab-dark.png + lab-light.png → judge → repeat
```

Judge against, **light theme** (the owner's #1 ask):
- The sidebar slab mock over the busy content block: content visibly diffuses through it; the slab is defined by the slate edge + the two-layer shadow, NOT by a white fill. If you can't tell glass from canvas → raise `--sx-depth-*`, not the fill.
- Buttons/inputs/rows read as faint translucent slate tints — visibly *not* opaque white (the `light-members.png` wash is the failure mode), yet crisp.
- Modal over busy content: translucent but text fully comfortable, and **not muddy gray** (`light-settings-modal.png` failure mode — if muddy, lower `--sx-overlay` within its band before touching the fill).
- Contrast table from the harness passes ≥4.5:1 — if a cell fails, raise that surface's fill, never dim text.

**Ultra-dark:**
- Field blobs clearly visible on the canvas strip (the `dark-home.png` flat-black sea is the failure mode).
- Slab over busy content shows brightness lift (`--sx-glass-brightness`) — glass is *lighter inside* than outside, like real backlit glass.
- Tier B buttons/rows read as translucent white-tint over the field.
- Rim = top-left arc only (Law 16); no violet anywhere, including In-Progress/Medium chips, including *through* glass (2.3).

Both: no glow, no color fog (the field is monochrome), accent appears nowhere except CTA/focus/tick specimens; scrollbar specimens styled.

## 2.6 Gate & DoD

- `npm run lint && npm run build && npm run visual-qa` green incl. contrast floor.
- Greps: `#ffffff\|#100f13\|#17161b\|#1d1c22` as values of `--sx-surface*` → 0; `0\.65\|0\.72\|0\.85` gone from light glass fills; `backdrop-filter` inside `--card`/`--pill` variants → 0; violet survivors `8f8ae0\|a190d9\|7a64c2\|6257c9` in `src/` → 0.
- Final lab PNGs (both themes) committed under `shots/<sha>/` and explicitly described in PROGRESS.md (what was tuned, final ± values chosen, the purple-smear culprit).
- Commit: `feat(frontend): [glass-v2 2/4] transparent material — token retune, brightness chain, dual edge, rim re-cut, tier-B alpha surfaces, scrollbars`.
