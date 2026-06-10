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
