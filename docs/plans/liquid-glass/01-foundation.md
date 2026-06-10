# Phase 1 — Foundation: token contract, two themes, depth field

> Prereq: none (first phase). Read `00-MASTER.md` §2–§4 first.
> Output: the entire app runs on a single semantic token contract with exactly two themes; the purple glow and the 640-line light override layer are gone; nothing looks *finished* yet, but nothing is broken and both themes are structurally sound.

## Goal

Invert the theme architecture. Today: hardcoded dark + `!important` light patches. After this phase: one declared token contract (`tokens.css`, ultra-dark values) + one re-valuation file (`themes/light.css`, same token names, light values), switched by `data-theme` on `<html>`. All glow vocabulary deleted.

## Tasks

### 1.1 Rewrite `src/styles/tokens.css` as the contract
Declare on `:root` (ultra-dark = default). Keep the `--sx-` prefix. The contract below is the **complete public API** — components may consume only these (plus status/priority tokens):

```css
:root {
  color-scheme: dark;

  /* Canvas & depth field */
  --sx-canvas: #08070a;
  --sx-canvas-elevated: #0e0d11;
  --sx-depth-a: rgb(255 255 255 / 0.03);   /* depth-field blobs — monochrome ONLY */
  --sx-depth-b: rgb(255 255 255 / 0.015);

  /* Glass material inputs (consumed by glass.css recipes, Phase 2) */
  --sx-glass-fill-top: rgb(255 255 255 / 0.055);
  --sx-glass-fill-bottom: rgb(255 255 255 / 0.02);
  --sx-glass-blur: 28px;
  --sx-glass-saturate: 160%;
  --sx-rim-bright: rgb(255 255 255 / 0.28);  /* light-catching edge */
  --sx-rim-faint: rgb(255 255 255 / 0.05);
  --sx-thickness: rgb(0 0 0 / 0.35);          /* bottom inner shadow */

  /* Solid surfaces (rows, chips — NO blur, pre-mixed against canvas) */
  --sx-surface: #100f13;
  --sx-surface-hover: #17161b;
  --sx-surface-active: #1d1c22;

  /* Hairlines (rare; see Design Law 3) */
  --sx-line: rgb(255 255 255 / 0.06);
  --sx-line-strong: rgb(255 255 255 / 0.11);

  /* Text */
  --sx-text: #f4f2f0;
  --sx-text-muted: rgb(244 242 240 / 0.64);
  --sx-text-subtle: rgb(244 242 240 / 0.44);
  --sx-text-disabled: rgb(244 242 240 / 0.28);

  /* Accent — brand crimson, scalpel use only (Design Law 6) */
  --sx-accent: #e6455a;
  --sx-accent-rgb: 230 69 90;
  --sx-accent-contrast: #ffffff;
  --sx-focus-ring: 0 0 0 3px rgb(var(--sx-accent-rgb) / 0.28);

  /* Shadows — NEUTRAL, never tinted */
  --sx-shadow-soft: 0 16px 48px rgb(0 0 0 / 0.42);
  --sx-shadow-elevated: 0 32px 80px rgb(0 0 0 / 0.55);
  --sx-overlay: rgb(0 0 0 / 0.62);
}
```

Then `themes/light.css` — **delete its entire current contents** and re-value the same list under `:root[data-theme="light"]`: canvas `#f4f5f7`, elevated `#ffffff`, glass fills white at 0.65/0.40, rim `rgb(255 255 255 / 0.85)` top / `rgb(15 23 42 / 0.06)` faint, surface `#ffffff`/`#f0f1f4`/`#e8eaee`, text slate `#16181d`, shadows `rgb(20 24 33 / 0.10–0.16)`, accent `#d63852`, `color-scheme: light`. Target ≤140 lines, **zero `!important`, zero descendant selectors**.

### 1.2 Status & priority palette (custom, both themes)
Replace stock Tailwind hexes. Keep the existing token *names* (`--status-*-bg/text`, `--priority-*-bg/text`) so chips keep working. Use a desaturated custom set, e.g. dark: backlog `#9b97a3`, todo `#7d9bd1`, progress `#8f8ae0`, review `#d9a06b`, done `#79c9a4`, canceled = `--sx-text-disabled`; urgent `#e0726f`, high `#d9a06b`, medium `#a190d9`, low `#7d9bd1`. Derive `-bg` as `color-mix(in srgb, <text> 14%, transparent)`. Light theme: same hues, darkened for contrast (AA on white).

### 1.3 Delete the glow vocabulary
- Remove from all CSS: `--sx-body-bg` radial accent layers, `--ambient-glow`, `--star-glow`, `--starlex-accent-glow`, `sidebarGlassDrift`, any `box-shadow` containing accent rgb.
- `grep -rn "glow\|radial-gradient" src/styles src --include="*.css" --include="*.tsx"` and clear every hit that paints colored fog (keep neutral-luminance radials only if part of the depth field below).

### 1.4 Depth field (replaces body glow)
New `src/styles/depth.css` + a single `<div className="sx-depth" aria-hidden>` rendered once in `Layout.tsx` behind everything:

```css
.sx-depth {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(900px 600px at 12% -8%, var(--sx-depth-a), transparent 70%),
    radial-gradient(1200px 800px at 88% 110%, var(--sx-depth-b), transparent 70%),
    var(--sx-canvas);
}
.sx-depth::after { /* fine monochrome noise kills banding — the single biggest "premium" upgrade on dark */
  content: ""; position: absolute; inset: 0; opacity: 0.5; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
}
```
Monochrome only — luminance variation ≤4%. On light theme the depth tokens become near-invisible cool tints (`rgb(20 24 33 / 0.02)`).

### 1.5 Theme system: 4 → 2
- `shared/contexts/themeConfig.ts`: `export type Theme = 'ultra-dark' | 'light'`; migration map for stored value: `dark→ultra-dark`, `solarized→light`, unknown→`ultra-dark`. Keep storage key.
- `ThemeContext.tsx` / `useTheme.ts`: set `document.documentElement.dataset.theme` (and keep `class="dark"` toggling **only** if shadcn variants depend on it — check `@custom-variant dark` in `index.css`; prefer re-pointing it to `[data-theme="ultra-dark"]`).
- Delete `styles/themes/ultra-dark.css` (its values are folded into `tokens.css`) and the solarized block. Update `index.css` imports.
- `pages/settings/Appearance.tsx`: two theme cards only (Ultra Dark — "Pure darkness", Light — "Clean and minimal"), previews rendered from tokens, not hardcoded swatches.

### 1.6 Kill the override layer & legacy aliases
- The new `themes/light.css` from 1.1 *is* the replacement; the 640-line `!important` file must not survive in any form.
- Legacy aliases (`--bg-primary`, `--bg-secondary: #051424`, `--glass-bg`, `--button-bg`, `--topbar-bg`, `--bg-sidebar`, `--border-sidebar`, `--priority-pill-*`…): re-point each to the new contract tokens *in one alias block at the bottom of tokens.css* (so the app keeps rendering), and add `/* @deprecated — remove in Phase 3 */`. Do **not** chase every consumer in this phase.
- Replace the 16 remaining `text-white*` / 3 `bg-white/*` literals in TSX with token classes (`text-[color:var(--sx-text)]` or the semantic class that already exists).

### 1.7 Typography & spacing base
In `base.css`: body 13px/1.45 Geist, headings tracking `-0.015em`, `.label-caps` = JetBrains Mono 10.5px / 0.16em tracking / uppercase / `--sx-text-subtle`. Define `--radius-sm/md/lg/xl: 8/10/14/20px` and use `xl` for floating slabs (sidebar, modals), `md` for cards, `sm` for controls.

## Definition of Done
- [ ] Exactly 2 themes selectable; old prefs migrate without crash
- [ ] `grep -rn '!important' src/styles/themes/` → 0 hits
- [ ] `grep -rn 'glow\|6366f1\|ambient' src/` → 0 hits (excluding this plan)
- [ ] Depth field visible on both themes; no purple anywhere
- [ ] App fully usable in both themes (it may still look transitional — Phase 2–4 restyle surfaces)
- [ ] `npm run lint && npm run build` green

Commit: `feat(frontend): [glass 1/5] semantic token contract, 2-theme reset, depth field, glow removal`
Append a handoff paragraph to `docs/plans/liquid-glass/PROGRESS.md` (what changed, any deviations, known rough spots).
